import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Heart, Loader2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ui/ConfirmModal';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import type { CatalogItem } from '../../types/item';
import { fetchFavoriteItems } from '../../services/favorites/favorites-items.service';
import {
  getFavoriteEntityTypeFromCategory,
  normalizeFavoriteId,
} from '../../services/favorites/favorites.types';

const initialBoardForm = {
  name: '',
};

export default function Favorites() {
  const navigate = useNavigate();
  const {
    favorites,
    boards,
    toggleFavorite,
    loading,
    boardsLoading,
    createBoard,
    deleteBoard,
    openFavoriteBoardPicker,
    removeFavoriteFromBoard,
  } =
    useFavorites();
  const { user } = useAuth();

  const [favoriteItems, setFavoriteItems] = useState<CatalogItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [isSavingBoard, setIsSavingBoard] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [boardForm, setBoardForm] = useState(initialBoardForm);
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null);

  type RemoveTarget = {
    boardId: number;
    item: { favorite_id: number; user_id: string; entity_type: string; entity_id: string; created_at: string };
    itemName: string;
  };
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    async function loadFavoriteItems() {
      try {
        setItemsLoading(true);
        const items = await fetchFavoriteItems(favorites);
        setFavoriteItems(items);
      } catch (error) {
        console.error('Error loading favorite items:', error);
        setFavoriteItems([]);
      } finally {
        setItemsLoading(false);
      }
    }

    loadFavoriteItems();
  }, [favorites]);

  const resetBoardForm = () => {
    setBoardForm(initialBoardForm);
    setBoardError('');
  };

  const handleCreateBoard = async () => {
    if (!user) {
      setBoardError('Please log in before creating a board.');
      return;
    }

    if (!boardForm.name.trim()) {
      setBoardError('Board name is required.');
      return;
    }

    try {
      setIsSavingBoard(true);
      setBoardError('');

      await createBoard(boardForm.name.trim());
      setIsCreateModalOpen(false);
      resetBoardForm();
    } catch (error) {
      console.error('Error creating board:', error);
      setBoardError('We could not create your board. Please try again.');
    } finally {
      setIsSavingBoard(false);
    }
  };

  const categoryAccent = (_category: string) => ({
    badge: 'bg-[#EABAB0]/30 text-[#875A6B]',
    price: 'text-[#875A6B]',
  });

  function getEntityTypeFromItem(item: CatalogItem) {
    return getFavoriteEntityTypeFromCategory(item.categoryKey);
  }

  function getBoardItems(board: (typeof boards)[number]) {
    return board.items
      .map((boardItem) => {
        const matchedItem = favoriteItems.find((item) => {
          const entityType = getEntityTypeFromItem(item);

          return (
            entityType === boardItem.entityType &&
            normalizeFavoriteId(item.id) === normalizeFavoriteId(boardItem.entityId)
          );
        });

        return matchedItem
          ? {
              catalogItem: matchedItem,
              entityType: boardItem.entityType,
              entityId: boardItem.entityId,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  function getFavoriteRowFromItem(item: CatalogItem) {
    const entityType = getEntityTypeFromItem(item);

    if (!entityType) {
      return null;
    }

    const normalizedId = normalizeFavoriteId(item.id);

    return (
      favorites.find(
        (favorite) =>
          favorite.entity_type === entityType &&
          normalizeFavoriteId(favorite.entity_id) === normalizedId,
      ) ?? null
    );
  }

  async function confirmDeleteBoard() {
    if (!user || deleteBoardId === null) return;
    try {
      setDeletingBoardId(deleteBoardId);
      await deleteBoard(deleteBoardId);
      toast.success('Board deleted.');
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Could not delete this board. Please try again.');
    } finally {
      setDeletingBoardId(null);
      setDeleteBoardId(null);
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    try {
      setIsRemoving(true);
      await removeFavoriteFromBoard(removeTarget.boardId, removeTarget.item);
    } catch (error) {
      console.error('Error removing from board:', error);
      toast.error('Could not remove item from board.');
    } finally {
      setIsRemoving(false);
      setRemoveTarget(null);
    }
  }

  if (loading || itemsLoading || boardsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="size-7 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Favorites</h1>
            <p className="text-base text-gray-600">
              Save items you love and organize them into event boards
            </p>
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-[#875A6B] hover:bg-[#6f4958] text-white rounded-2xl"
              >
                <Plus className="mr-2 size-5" />
                Create Board
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl rounded-[28px]">
              <DialogHeader>
                <DialogTitle>Create New Event Board</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="board-name">Board Name</Label>
                  <Input
                    id="board-name"
                    placeholder="Enter board name"
                    value={boardForm.name}
                    onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
                  />
                </div>

                <p className="text-sm text-gray-500 leading-6">
                  This will create an empty board that you can fill with saved favorites.
                </p>

                {boardError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {boardError}
                  </p>
                ) : null}

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-[#875A6B] hover:bg-[#6f4958] text-white"
                    onClick={() => void handleCreateBoard()}
                    disabled={isSavingBoard}
                  >
                    {isSavingBoard ? 'Creating...' : 'Create Board'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetBoardForm();
                    }}
                    disabled={isSavingBoard}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {favoriteItems.length > 0 && (
          <div className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Saved Items
                <span className="ml-2 font-bold text-slate-700">{favoriteItems.length}</span>
              </p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {favoriteItems.map((item) => {
                const accent = categoryAccent(item.category);
                const entityType = getEntityTypeFromItem(item);
                const favorite = getFavoriteRowFromItem(item);

                return (
                  <div
                    key={`${item.categoryKey}-${item.id}`}
                    onClick={() => navigate(`/${item.categoryKey}/${item.id}`)}
                    className="group cursor-pointer rounded-[24px] overflow-hidden bg-white border border-gray-100 shadow-[0_12px_40px_rgba(31,41,55,0.08)] hover:shadow-[0_20px_60px_rgba(31,41,55,0.12)] transition-all"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <button
                        type="button"
                        className="absolute top-4 right-4 rounded-2xl bg-white/95 p-3 shadow"
                        onClick={(e) => {
                          const normalizedItemId = normalizeFavoriteId(item.id);

                          console.log('BUTTON CLICK:', {
                            source: 'FavoritesPage',
                            userId: user?.id ?? null,
                            itemId: item.id,
                            normalizedItemId,
                            categoryKey: item.categoryKey,
                            entityType,
                          });

                          e.preventDefault();
                          e.stopPropagation();

                          if (!entityType) return;

                          console.log('BEFORE TOGGLE FAVORITE:', {
                            source: 'FavoritesPage',
                            entityType,
                            normalizedItemId,
                          });

                          void toggleFavorite(entityType, normalizedItemId);
                        }}
                      >
                        <Heart className="size-5 fill-red-500 text-red-500" />
                      </button>
                      {favorite ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Open actions for ${item.name}`}
                              className="absolute top-4 right-20 rounded-2xl border border-white/35 bg-white/15 p-3 text-white shadow backdrop-blur-md transition hover:bg-white/25"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <MoreVertical className="size-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 rounded-2xl border border-[#EABAB0]/40 p-2 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              className="rounded-xl px-3 py-2 text-sm font-medium text-gray-700"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openFavoriteBoardPicker(favorite, {
                                  name: item.name,
                                  image: item.image,
                                  category: item.category,
                                });
                              }}
                            >
                              Save to board
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${accent.badge}`}>
                          {item.category}
                        </span>
                        <span className={`text-lg font-bold ${accent.price}`}>{item.price}</span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight">
                        {item.name}
                      </h3>

                      <p className="text-gray-600 text-sm leading-6 line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Event Boards</h2>
          <p className="text-base text-gray-600">
            Create boards to organize favorites for different events
          </p>
        </div>

        {boards.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                className="rounded-[28px] bg-white shadow-[0_18px_60px_rgba(31,41,55,0.08)] border border-gray-100 p-8"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{board.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EABAB0]/30 px-3 py-1.5 text-sm font-semibold text-[#875A6B]">
                      {board.itemCount} {board.itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteBoardId(board.id)}
                      disabled={deletingBoardId === board.id}
                    >
                      <Trash2 className="size-3.5" />
                      {deletingBoardId === board.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-6 mb-4">
                  This board is stored in Supabase and includes your current favorites as board
                  items.
                </p>

                <div className="mb-6 space-y-3">
                  {getBoardItems(board).length > 0 ? (
                    getBoardItems(board).map(({ catalogItem, entityType, entityId }) => (
                      <div
                        key={`${board.id}-${entityType}-${entityId}`}
                        className="flex items-center justify-between gap-4 rounded-[22px] border border-gray-100 bg-[#fdf7f8] px-4 py-3"
                      >
                        <div
                          className="flex min-w-0 flex-1 items-center gap-4 cursor-pointer"
                          onClick={() => navigate(`/${catalogItem.categoryKey}/${catalogItem.id}`)}
                        >
                          <img
                            src={catalogItem.image}
                            alt={catalogItem.name}
                            className="size-16 rounded-2xl object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-gray-800">
                              {catalogItem.name}
                            </p>
                            <p className="text-xs text-gray-500">{catalogItem.category}</p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() =>
                            setRemoveTarget({
                              boardId: board.id,
                              item: {
                                favorite_id: 0,
                                user_id: user?.id ?? '',
                                entity_type: entityType,
                                entity_id: entityId,
                                created_at: '',
                              },
                              itemName: catalogItem.name,
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-gray-200 bg-[#fdf7f8] px-4 py-6 text-center text-gray-500">
                      No items in this board yet.
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-base text-gray-600">
                  <div className="rounded-2xl bg-[#fdf7f8] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">Created</p>
                    <p className="font-semibold text-gray-800">
                      {board.createdAt
                        ? new Date(board.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#fdf7f8] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">
                      Board ID
                    </p>
                    <p className="font-semibold text-gray-800">{board.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto rounded-[28px] bg-white shadow-[0_18px_60px_rgba(31,41,55,0.08)] border border-gray-100 p-16 text-center">
            <div className="inline-flex items-center justify-center size-24 rounded-full bg-[#EABAB0]/30 mb-6">
              <Heart className="size-12 text-[#875A6B]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Event Boards Yet</h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              Create a board to group favorites for one event.
            </p>
            <Button
              size="lg"
              className="bg-[#875A6B] hover:bg-[#6f4958] text-white rounded-2xl"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="mr-2 size-5" />
              Create Your First Board
            </Button>
          </div>
        )}

        {favoriteItems.length === 0 && (
          <div className="max-w-3xl mx-auto mt-12 rounded-[28px] bg-white shadow-[0_18px_60px_rgba(31,41,55,0.08)] border border-gray-100 p-16 text-center">
            <div className="inline-flex items-center justify-center size-24 rounded-full bg-[#EABAB0]/30 mb-6">
              <Heart className="size-12 text-[#875A6B]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Saved Items Yet</h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              Start exploring venues, restaurants, catering, and decor, then tap the heart to save them here.
            </p>
            <Button
              size="lg"
              className="bg-[#875A6B] hover:bg-[#6f4958] text-white rounded-2xl"
              onClick={() => navigate('/venues')}
            >
              Browse Options
            </Button>
          </div>
        )}
      </div>
    </div>

    <ConfirmModal
      open={removeTarget !== null}
      variant="warning"
      title="Remove from board?"
      description={`"${removeTarget?.itemName}" will be removed from this board.`}
      confirmLabel="Remove"
      loading={isRemoving}
      onCancel={() => setRemoveTarget(null)}
      onConfirm={() => void handleConfirmRemove()}
    />

    <ConfirmModal
      open={deleteBoardId !== null}
      variant="danger"
      title="Delete this board?"
      description="This will permanently remove the board and all its saved items."
      confirmLabel="Delete Board"
      loading={deletingBoardId !== null}
      onCancel={() => setDeleteBoardId(null)}
      onConfirm={() => void confirmDeleteBoard()}
    />
    </>
  );
}
