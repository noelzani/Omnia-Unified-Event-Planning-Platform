import ConfirmModal from "../../components/ui/ConfirmModal";

type DeleteConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  open,
  title = "Delete item?",
  description = "This action cannot be undone.",
  loading = false,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <ConfirmModal
      open={open}
      variant="danger"
      title={title}
      description={description}
      confirmLabel="Delete"
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
