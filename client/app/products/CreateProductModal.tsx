"use client";

import { AlertCircle, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type ProductFormData = {
  name: string;
  price: number;
  stockQuantity: number;
  rating?: number;
};

type CreateProductModalProps = {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (formData: ProductFormData) => Promise<void>;
};

const emptyForm = {
  name: "",
  price: "",
  stockQuantity: "",
  rating: "",
};

const CreateProductModal = ({
  isOpen,
  isCreating,
  onClose,
  onCreate,
}: CreateProductModalProps) => {
  const [formData, setFormData] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    window.setTimeout(() => {
      const firstInput = dialogRef.current?.querySelector<HTMLElement>(
        "input, button, select, textarea, a[href]",
      );
      firstInput?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isCreating) {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [isCreating, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const name = formData.name.trim();
    const price = Number(formData.price);
    const stockQuantity = Number(formData.stockQuantity);
    const rating =
      formData.rating === "" ? undefined : Number(formData.rating);

    if (!name) {
      setErrorMessage("Product name is required.");
      setFieldErrors({ name: "Product name is required." });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage("Price must be zero or greater.");
      setFieldErrors({ price: "Price must be zero or greater." });
      return;
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setErrorMessage("Stock quantity must be a whole number of zero or greater.");
      setFieldErrors({
        stockQuantity: "Stock quantity must be a whole number of zero or greater.",
      });
      return;
    }
    if (
      rating !== undefined &&
      (!Number.isFinite(rating) || rating < 0 || rating > 5)
    ) {
      setErrorMessage("Rating must be between 0 and 5.");
      setFieldErrors({ rating: "Rating must be between 0 and 5." });
      return;
    }

    try {
      await onCreate({ name, price, stockQuantity, rating });
      setFormData(emptyForm);
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The product could not be created. Check the API and try again.",
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 pt-[8vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isCreating) onClose();
      }}
    >
      <div
        aria-labelledby="create-product-title"
        aria-modal="true"
        className="surface w-full max-w-lg shadow-xl"
        ref={dialogRef}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2
              className="font-semibold text-slate-950 dark:text-white"
              id="create-product-title"
            >
              Create product
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add a product to the catalog and inventory.
            </p>
          </div>
          <button
            aria-label="Close dialog"
            className="button-ghost h-8 w-8 p-0"
            disabled={isCreating}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form className="space-y-4 p-5" onSubmit={handleSubmit}>
          {errorMessage ? (
            <div
              className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Product name
            </span>
            <input
              autoFocus
              className="field"
              disabled={isCreating}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "product-name-error" : undefined}
              maxLength={120}
              onChange={(event) =>
                setFormData({ ...formData, name: event.target.value })
              }
              placeholder="Example: Wireless barcode scanner"
              required
              value={formData.name}
            />
            {fieldErrors.name ? (
              <span className="mt-1 block text-xs text-red-600" id="product-name-error">
                {fieldErrors.name}
              </span>
            ) : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Price (USD)
              </span>
              <input
                className="field"
                disabled={isCreating}
                aria-invalid={Boolean(fieldErrors.price)}
                aria-describedby={fieldErrors.price ? "product-price-error" : undefined}
                min="0"
                onChange={(event) =>
                  setFormData({ ...formData, price: event.target.value })
                }
                placeholder="0.00"
                required
                step="0.01"
                type="number"
                value={formData.price}
              />
              {fieldErrors.price ? (
                <span className="mt-1 block text-xs text-red-600" id="product-price-error">
                  {fieldErrors.price}
                </span>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Stock quantity
              </span>
              <input
                className="field"
                disabled={isCreating}
                aria-invalid={Boolean(fieldErrors.stockQuantity)}
                aria-describedby={
                  fieldErrors.stockQuantity ? "product-stock-error" : undefined
                }
                min="0"
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    stockQuantity: event.target.value,
                  })
                }
                placeholder="0"
                required
                step="1"
                type="number"
                value={formData.stockQuantity}
              />
              {fieldErrors.stockQuantity ? (
                <span className="mt-1 block text-xs text-red-600" id="product-stock-error">
                  {fieldErrors.stockQuantity}
                </span>
              ) : null}
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Rating
              <span className="font-normal text-slate-400"> (optional)</span>
            </span>
            <input
              className="field"
              disabled={isCreating}
              aria-invalid={Boolean(fieldErrors.rating)}
              aria-describedby={fieldErrors.rating ? "product-rating-error" : undefined}
              max="5"
              min="0"
              onChange={(event) =>
                setFormData({ ...formData, rating: event.target.value })
              }
              placeholder="0 to 5"
              step="0.1"
              type="number"
              value={formData.rating}
            />
            {fieldErrors.rating ? (
              <span className="mt-1 block text-xs text-red-600" id="product-rating-error">
                {fieldErrors.rating}
              </span>
            ) : null}
          </label>

          <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              className="button-primary min-w-28"
              disabled={isCreating}
              type="submit"
            >
              {isCreating ? "Creating..." : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
