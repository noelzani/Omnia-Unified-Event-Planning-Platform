import { useEffect, useMemo, useState } from 'react';
import { FolderHeart, Heart, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import type { FavoriteBoard } from '../../services/favorites/boards.service';
import type { FavoriteRow } from '../../services/favorites/favorites.types';
import { normalizeFavoriteId } from '../../services/favorites/favorites.types';

type PendingBoardAssignment = {
  favorite: FavoriteRow;
  preview: {
    name: string;
    image: string;
    category: string;
  };
} | null;

type BoardPickerDialogProps = {
  boards: FavoriteBoard[];
  open: boolean;
  pendingAssignment: PendingBoardAssignment;
  onClose: () => void;
  onCreateBoard: (name: string, favorite: FavoriteRow) => Promise<void>;
  onSaveToBoard: (boardId: number, favorite: FavoriteRow) => Promise<void>;
};

export function BoardPickerDialog({
  boards,
  open,
  pendingAssignment,
  onClose,
  onCreateBoard,
  onSaveToBoard,
}: BoardPickerDialogProps) {
  const [newBoardName, setNewBoardName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savedBoardIds = useMemo(() => {
    if (!pendingAssignment) {
      return new Set<number>();
    }

    return new Set(
      boards
        .filter((board) =>
          board.items.some(
            (item) =>
              item.entityType === pendingAssignment.favorite.entity_type &&
              normalizeFavoriteId(item.entityId) ===
                normalizeFavoriteId(pendingAssignment.favorite.entity_id),
          ),
        )
        .map((board) => board.id),
    );
  }, [boards, pendingAssignment]);

  const handleClose = () => {
    setNewBoardName('');
    setErrorMessage('');
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setNewBoardName('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleCreateBoard = async () => {
    if (!pendingAssignment) {
      return;
    }

    if (!newBoardName.trim()) {
      setErrorMessage('Board name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onCreateBoard(newBoardName.trim(), pendingAssignment.favorite);
      setNewBoardName('');
    } catch (error) {
      console.error('Error creating board from board picker:', error);
      setErrorMessage('We could not create the board. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSaveToBoard = async (boardId: number) => {
    if (!pendingAssignment) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSaveToBoard(boardId, pendingAssignment.favorite);
    } catch (error) {
      console.error('Error saving favorite to board:', error);
      setErrorMessage('We could not save this favorite to the board.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent className="w-[min(1100px,calc(100%-2rem))] max-w-none overflow-hidden rounded-[32px] border-0 bg-white p-0 shadow-[0_32px_120px_rgba(135,90,107,0.22)] sm:max-w-none">
        {pendingAssignment ? (
          <div className="grid gap-0 md:grid-cols-[0.95fr_1.25fr]">
            <div className="bg-gradient-to-br from-[#875A6B] via-[#A76B82] to-[#EABAB0] p-8 text-white">
              

              <div className="overflow-hidden rounded-[28px] bg-white/12 backdrop-blur-sm">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={pendingAssignment.preview.image || 'https://placehold.co/600x400?text=Saved'}
                    alt={pendingAssignment.preview.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                    {pendingAssignment.preview.category}
                  </p>
                  <h3 className="text-2xl font-bold leading-tight">
                    {pendingAssignment.preview.name}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/85">
                    Choose where this favorite should live next.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <DialogHeader className="mb-5 text-left">
                <DialogTitle className="text-3xl font-bold text-gray-800">
                  Save To A Board
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-[#EABAB0]/40 bg-[#fcf9fd] p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#875A6B] shadow-sm">
                      <Plus className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">Create New Board</p>
                      <p className="text-sm text-gray-500">
                        Make a fresh board and add this favorite to it.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Input
                      placeholder="Board name"
                      value={newBoardName}
                      onChange={(event) => setNewBoardName(event.target.value)}
                      disabled={isSubmitting}
                      className="h-12 rounded-2xl border-[#EABAB0]/40 bg-white"
                    />
                    <Button
                      className="h-12 rounded-2xl bg-gradient-to-r from-[#875A6B] to-[#EABAB0] px-5 text-white hover:opacity-95"
                      onClick={() => void handleCreateBoard()}
                      disabled={isSubmitting}
                    >
                      Create
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <FolderHeart className="size-5 text-[#875A6B]" />
                    <p className="text-lg font-bold text-gray-800">Save To Existing Board</p>
                  </div>

                  {boards.length > 0 ? (
                    <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                      {boards.map((board) => {
                        const alreadySaved = savedBoardIds.has(board.id);

                        return (
                          <button
                            key={board.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-[24px] border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-[#EABAB0] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55"
                            onClick={() => void handleSaveToBoard(board.id)}
                            disabled={isSubmitting || alreadySaved}
                          >
                            <div>
                              <p className="text-lg font-semibold text-gray-800">{board.name}</p>
                              <p className="text-sm text-gray-500">
                                {board.itemCount} {board.itemCount === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                            <span className="rounded-full bg-[#fcf4f8] px-3 py-1 text-sm font-semibold text-[#875A6B]">
                              {alreadySaved ? 'Saved' : 'Choose'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[#EABAB0]/60 bg-[#fcf9fd] p-5 text-sm leading-6 text-gray-500">
                      No boards yet. Create your first board above.
                    </div>
                  )}
                </div>

                {errorMessage ? (
                  <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                ) : null}

                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-[#EABAB0]/50 bg-white text-gray-700 hover:bg-[#fcf9fd]"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  <Heart className="size-4 text-[#875A6B]" />
                  Keep In Favorites Only
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
