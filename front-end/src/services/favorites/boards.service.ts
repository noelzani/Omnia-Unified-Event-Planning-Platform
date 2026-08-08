import { supabase } from '../../lib/supabase';
import type { FavoriteEntityType, FavoriteRow } from './favorites.types';

type BoardRow = {
  board_id: number;
  user_id: string;
  name: string | null;
  created_at: string | null;
  board_items?: BoardItemRow[];
};

type BoardItemRow = {
  board_item_id: number;
  entity_type: FavoriteEntityType;
  entity_id: number;
};

export type FavoriteBoard = {
  id: number;
  userId: string;
  name: string;
  createdAt: string | null;
  itemCount: number;
  items: Array<{
    entityType: FavoriteEntityType;
    entityId: number;
  }>;
};

type CreateFavoriteBoardInput = {
  userId: string;
  name?: string;
  favorites: FavoriteRow[];
};

function normalizeBoardRow(row: BoardRow): FavoriteBoard {
  return {
    id: row.board_id,
    userId: row.user_id,
    name: row.name?.trim() || 'Untitled Board',
    createdAt: row.created_at,
    itemCount: row.board_items?.length ?? 0,
    items:
      row.board_items?.map((item) => ({
        entityType: item.entity_type,
        entityId: item.entity_id,
      })) ?? [],
  };
}

export async function listFavoriteBoards(userId: string): Promise<FavoriteBoard[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('board_id, user_id, name, created_at, board_items(board_item_id, entity_type, entity_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeBoardRow(row as BoardRow));
}

export async function createFavoriteBoard(
  input: CreateFavoriteBoardInput,
): Promise<FavoriteBoard> {
  const trimmedName = input.name?.trim() || null;

  const { data: board, error: boardError } = await supabase
    .from('boards')
    .insert({
      user_id: input.userId,
      name: trimmedName,
    })
    .select('board_id, user_id, name, created_at')
    .single();

  if (boardError) {
    throw boardError;
  }

  const boardId = (board as BoardRow).board_id;

  if (input.favorites.length > 0) {
    const boardItems = input.favorites.map((favorite) => ({
      board_id: boardId,
      entity_type: favorite.entity_type,
      entity_id: favorite.entity_id,
    }));

    const { error: boardItemsError } = await supabase
      .from('board_items')
      .insert(boardItems);

    if (boardItemsError) {
      await supabase.from('boards').delete().eq('board_id', boardId);
      throw boardItemsError;
    }
  }

  return {
    id: boardId,
    userId: (board as BoardRow).user_id,
    name: (board as BoardRow).name?.trim() || 'Untitled Board',
    createdAt: (board as BoardRow).created_at,
    itemCount: input.favorites.length,
    items: input.favorites.map((favorite) => ({
      entityType: favorite.entity_type,
      entityId: favorite.entity_id,
    })),
  };
}

export async function addFavoriteToBoard(
  boardId: number,
  favorite: Pick<FavoriteRow, 'entity_type' | 'entity_id'>,
) {
  const { error } = await supabase
    .from('board_items')
    .insert({
      board_id: boardId,
      entity_type: favorite.entity_type,
      entity_id: favorite.entity_id,
    });

  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function removeFavoriteFromBoard(
  boardId: number,
  favorite: Pick<FavoriteRow, 'entity_type' | 'entity_id'>,
) {
  const { error } = await supabase
    .from('board_items')
    .delete()
    .eq('board_id', boardId)
    .eq('entity_type', favorite.entity_type)
    .eq('entity_id', favorite.entity_id);

  if (error) {
    throw error;
  }
}

export async function removeFavoriteFromAllBoards(
  userId: string,
  favorite: Pick<FavoriteRow, 'entity_type' | 'entity_id'>,
) {
  const { data: boards, error: boardsError } = await supabase
    .from('boards')
    .select('board_id')
    .eq('user_id', userId);

  if (boardsError) {
    throw boardsError;
  }

  const boardIds = (boards ?? []).map((board) => board.board_id);

  if (boardIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('board_items')
    .delete()
    .in('board_id', boardIds)
    .eq('entity_type', favorite.entity_type)
    .eq('entity_id', favorite.entity_id);

  if (error) {
    throw error;
  }
}

export async function deleteFavoriteBoard(boardId: number, userId: string) {
  const { error: boardItemsError } = await supabase
    .from('board_items')
    .delete()
    .eq('board_id', boardId);

  if (boardItemsError) {
    throw boardItemsError;
  }

  const { error: boardError } = await supabase
    .from('boards')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId);

  if (boardError) {
    throw boardError;
  }
}
