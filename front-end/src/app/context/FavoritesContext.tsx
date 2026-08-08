import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from './AuthContext';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
} from '../../services/favorites/favorites.service';
import {
  addFavoriteToBoard,
  createFavoriteBoard,
  deleteFavoriteBoard,
  listFavoriteBoards,
  removeFavoriteFromAllBoards,
  removeFavoriteFromBoard,
  type FavoriteBoard,
} from '../../services/favorites/boards.service';

import type {
  FavoriteEntityType,
  FavoriteRow,
} from '../../services/favorites/favorites.types';
import {
  normalizeFavoriteId,
  normalizeFavoriteRow,
} from '../../services/favorites/favorites.types';
import { BoardPickerDialog } from '../components/BoardPickerDialog';

type FavoriteItemPreview = {
  name: string;
  image: string;
  category: string;
};

type PendingBoardAssignment = {
  favorite: FavoriteRow;
  preview: FavoriteItemPreview;
};

interface FavoritesContextType {
  favorites: FavoriteRow[];
  boards: FavoriteBoard[];
  loading: boolean;
  boardsLoading: boolean;
  isFavorite: (type: FavoriteEntityType, id: number) => boolean;
  toggleFavorite: (
    type: FavoriteEntityType,
    id: number,
    preview?: FavoriteItemPreview,
  ) => Promise<void>;
  createBoard: (name: string, items?: FavoriteRow[]) => Promise<FavoriteBoard>;
  assignFavoriteToBoard: (boardId: number, favorite: FavoriteRow) => Promise<void>;
  removeFavoriteFromBoard: (boardId: number, favorite: FavoriteRow) => Promise<void>;
  deleteBoard: (boardId: number) => Promise<void>;
  openFavoriteBoardPicker: (
    favorite: FavoriteRow,
    preview: FavoriteItemPreview,
  ) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [boards, setBoards] = useState<FavoriteBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [pendingBoardAssignment, setPendingBoardAssignment] =
    useState<PendingBoardAssignment | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      console.log('FAVORITES PROVIDER LOAD START:', {
        userId: user?.id ?? null,
      });

      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserFavorites(user.id);
        console.log('FAVORITES PROVIDER LOAD SUCCESS:', data);
        setFavorites(data);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [user]);

  useEffect(() => {
    async function loadBoards() {
      if (!user) {
        setBoards([]);
        setBoardsLoading(false);
        return;
      }

      try {
        setBoardsLoading(true);
        const data = await listFavoriteBoards(user.id);
        setBoards(data);
      } catch (error) {
        console.error('Error loading boards:', error);
      } finally {
        setBoardsLoading(false);
      }
    }

    void loadBoards();
  }, [user]);

  function isFavorite(type: FavoriteEntityType, id: number) {
    const normalizedId = normalizeFavoriteId(id);
    const result = favorites.some(
      (f) =>
        f.entity_type === type && normalizeFavoriteId(f.entity_id) === normalizedId,
    );

    console.log('IS FAVORITE CHECK:', {
      type,
      id,
      normalizedId,
      favorites,
      result,
    });

    return result;
  }

  async function toggleFavorite(
    type: FavoriteEntityType,
    id: number,
    preview?: FavoriteItemPreview,
  ) {
    const normalizedId = normalizeFavoriteId(id);

    console.log('INSIDE TOGGLE FAVORITE:', {
      userId: user?.id ?? null,
      type,
      id,
      normalizedId,
    });

    if (!user) {
      console.log('TOGGLE FAVORITE ABORTED: no user at click time');
      const { toast } = await import('sonner');
      toast.error('You must be logged in to save favorites.');
      return;
    }

    const exists = isFavorite(type, normalizedId);

    console.log('TOGGLE FAVORITE EXISTENCE CHECK:', {
      type,
      normalizedId,
      exists,
    });

    try {
      if (exists) {
        await removeFavoriteFromAllBoards(user.id, {
          entity_type: type,
          entity_id: normalizedId,
        });
        await removeFavorite(user.id, type, normalizedId);
        setFavorites((prev) => {
          const nextFavorites = prev.filter(
            (f) =>
              !(
                f.entity_type === type &&
                normalizeFavoriteId(f.entity_id) === normalizedId
              ),
          );

          console.log('AFTER LOCAL STATE UPDATE:', nextFavorites);
          return nextFavorites;
        });

        setBoards((prev) =>
          prev.map((board) => {
            const nextItems = board.items.filter(
              (item) =>
                !(
                  item.entityType === type &&
                  normalizeFavoriteId(item.entityId) === normalizedId
                ),
            );

            return {
              ...board,
              items: nextItems,
              itemCount: nextItems.length,
            };
          }),
        );
      } else {
        console.log('BEFORE ADD FAVORITE:', {
          userId: user.id,
          type,
          entityId: normalizedId,
        });

        const newFav = await addFavorite(user.id, type, normalizedId);
        const normalizedFavorite = normalizeFavoriteRow(newFav);
        setFavorites((prev) => {
          const nextFavorites = [normalizedFavorite, ...prev];
          console.log('AFTER LOCAL STATE UPDATE:', nextFavorites);
          return nextFavorites;
        });

        if (preview) {
          setPendingBoardAssignment({
            favorite: normalizedFavorite,
            preview,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  async function createBoard(name: string, items: FavoriteRow[] = []) {
    if (!user) {
      throw new Error('You must be logged in to create a board.');
    }

    const board = await createFavoriteBoard({
      userId: user.id,
      name,
      favorites: items,
    });

    setBoards((prev) => [board, ...prev]);
    return board;
  }

  async function assignFavoriteToBoard(boardId: number, favorite: FavoriteRow) {
    await addFavoriteToBoard(boardId, favorite);

    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== boardId) {
          return board;
        }

        const alreadyExists = board.items.some(
          (item) =>
            item.entityType === favorite.entity_type &&
            normalizeFavoriteId(item.entityId) === normalizeFavoriteId(favorite.entity_id),
        );

        if (alreadyExists) {
          return board;
        }

        return {
          ...board,
          itemCount: board.itemCount + 1,
          items: [
            ...board.items,
            {
              entityType: favorite.entity_type,
              entityId: favorite.entity_id,
            },
          ],
        };
      }),
    );
  }

  async function removeBoardItem(boardId: number, favorite: FavoriteRow) {
    await removeFavoriteFromBoard(boardId, favorite);

    setBoards((prev) =>
      prev.map((board) => {
        if (board.id !== boardId) {
          return board;
        }

        const nextItems = board.items.filter(
          (item) =>
            !(
              item.entityType === favorite.entity_type &&
              normalizeFavoriteId(item.entityId) === normalizeFavoriteId(favorite.entity_id)
            ),
        );

        return {
          ...board,
          items: nextItems,
          itemCount: nextItems.length,
        };
      }),
    );
  }

  async function deleteBoard(boardId: number) {
    if (!user) {
      throw new Error('You must be logged in to delete a board.');
    }

    await deleteFavoriteBoard(boardId, user.id);
    setBoards((prev) => prev.filter((board) => board.id !== boardId));
  }

  function openFavoriteBoardPicker(
    favorite: FavoriteRow,
    preview: FavoriteItemPreview,
  ) {
    setPendingBoardAssignment({
      favorite,
      preview,
    });
  }

  return (
    <>
      <FavoritesContext.Provider
        value={{
          favorites,
          boards,
          loading,
          boardsLoading,
          isFavorite,
          toggleFavorite,
          createBoard,
          assignFavoriteToBoard,
          removeFavoriteFromBoard: removeBoardItem,
          deleteBoard,
          openFavoriteBoardPicker,
        }}
      >
        {children}
      </FavoritesContext.Provider>

      <BoardPickerDialog
        boards={boards}
        open={pendingBoardAssignment !== null}
        pendingAssignment={pendingBoardAssignment}
        onClose={() => setPendingBoardAssignment(null)}
        onCreateBoard={async (name, favorite) => {
          await createBoard(name, [favorite]);
          setPendingBoardAssignment(null);
        }}
        onSaveToBoard={async (boardId, favorite) => {
          await assignFavoriteToBoard(boardId, favorite);
          setPendingBoardAssignment(null);
        }}
      />
    </>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      'useFavorites must be used inside FavoritesProvider',
    );
  }

  return context;
}
