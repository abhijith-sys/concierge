import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CategoryEditorForm,
  emptyCategoryDraft,
  payloadFromDraft,
  type CategoryDraft,
} from "../components/CategoryEditorForm";
import { ApiError, api, hasPermission, type Category } from "../lib/api";
import { isPlatform, slugifyName } from "../lib/taxonomy";
import { useAuth } from "../context/auth";

export function CategoriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasPermission(user, "categories.write");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<CategoryDraft>(() => emptyCategoryDraft("1"));
  const [addingUnder, setAddingUnder] = useState<string | null>(null);
  const [subDraft, setSubDraft] = useState<CategoryDraft>(() => emptyCategoryDraft("1"));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: api.categories,
    enabled: canWrite || hasPermission(user, "category_fields.write"),
  });

  const roots = useMemo(
    () => (categories.data ?? []).filter((category) => !isPlatform(category)),
    [categories.data],
  );
  const platform = (categories.data ?? []).find(isPlatform);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  }

  const create = useMutation({
    mutationFn: () => api.createCategory(payloadFromDraft(draft, { isActive: true })),
    onSuccess: async () => {
      setDraft(emptyCategoryDraft(String(roots.length + 1)));
      setShowCreate(false);
      await refresh();
    },
  });

  const createSub = useMutation({
    mutationFn: () =>
      api.createCategory(
        payloadFromDraft(subDraft, { parentId: addingUnder, isActive: true }),
      ),
    onSuccess: async () => {
      setAddingUnder(null);
      setSubDraft(emptyCategoryDraft("1"));
      await refresh();
    },
  });

  const setActive = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      api.updateCategory(input.id, { isActive: input.isActive }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id, true),
    onSuccess: refresh,
  });

  if (!canWrite && !hasPermission(user, "category_fields.write")) {
    return <p className="error">Missing categories.write permission</p>;
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0 }}>Categories</h2>
          <p className="muted">
            This catalog drives the public home screen and listings pages. Every main category and
            subcategory needs a description, background/card image, and banner image.
          </p>
        </div>
        {canWrite ? (
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              setShowCreate((open) => !open);
              setDraft(emptyCategoryDraft(String(roots.length + 1)));
            }}
          >
            {showCreate ? "Close" : "Add main category"}
          </button>
        ) : null}
      </div>

      {platform ? (
        <div className="panel row" style={{ justifyContent: "space-between" }}>
          <div>
            <strong>Platform common fields</strong>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              Shared provider and listing fields inherited by every category. Hidden from public browse.
            </p>
          </div>
          <Link className="btn" to={`/categories/${platform.id}/forms`}>
            Configure common forms
          </Link>
        </div>
      ) : null}

      {canWrite && showCreate ? (
        <CategoryEditorForm
          title="Add main category"
          submitLabel={create.isPending ? "Creating…" : "Create category"}
          draft={draft}
          pending={create.isPending}
          error={create.error instanceof ApiError ? create.error.message : create.isError ? "Create failed" : undefined}
          onChange={setDraft}
          onSlugFromName={(name) => {
            setDraft((current) =>
              !current.slug || current.slug === slugifyName(current.name)
                ? { ...current, name, slug: slugifyName(name) }
                : { ...current, name },
            );
          }}
          onSubmit={() => create.mutate()}
          onCancel={() => setShowCreate(false)}
        />
      ) : null}

      {categories.isLoading ? <p className="muted">Loading…</p> : null}
      {categories.isError ? <p className="error">Failed to load categories</p> : null}
      {!categories.isLoading && roots.length === 0 ? (
        <p className="muted">No main categories yet. Use Add main category to create the first one.</p>
      ) : null}

      {roots.map((category) => {
        const children = category.children ?? [];
        const open = collapsed[category.id] !== true;
        const addingHere = addingUnder === category.id;
        return (
          <article key={category.id} className="cat-card">
            <CategorySummary
              category={category}
              canWrite={canWrite}
              kind="Main category"
              onToggle={() => setCollapsed((current) => ({ ...current, [category.id]: open }))}
              expanded={open}
              childCount={children.length}
              onEnable={() => setActive.mutate({ id: category.id, isActive: true })}
              onDisable={() => {
                if (window.confirm(`Disable “${category.name}”? It will be hidden from the public site.`)) {
                  setActive.mutate({ id: category.id, isActive: false });
                }
              }}
              onDelete={() => {
                if (
                  window.confirm(
                    `Permanently delete “${category.name}”? If it has listings or subcategories, deletion will fail — disable it instead.`,
                  )
                ) {
                  remove.mutate(category.id);
                }
              }}
              extraActions={
                canWrite ? (
                  <button
                    className="btn primary"
                    type="button"
                    onClick={() => {
                      setAddingUnder(addingHere ? null : category.id);
                      setSubDraft(
                        emptyCategoryDraft(String(children.length + 1), category.kind === "service" ? "service" : "supplier"),
                      );
                    }}
                  >
                    {addingHere ? "Close" : "Add subcategory"}
                  </button>
                ) : null
              }
            />
            {remove.isError && remove.variables === category.id ? (
              <p className="error">
                {remove.error instanceof ApiError ? remove.error.message : "Delete failed"}
              </p>
            ) : null}
            {addingHere ? (
              <CategoryEditorForm
                title={`Add subcategory under ${category.name}`}
                submitLabel={createSub.isPending ? "Adding…" : "Add subcategory"}
                draft={subDraft}
                isSubcategory
                pending={createSub.isPending}
                error={
                  createSub.error instanceof ApiError
                    ? createSub.error.message
                    : createSub.isError
                      ? "Create failed"
                      : undefined
                }
                onChange={setSubDraft}
                onSlugFromName={(name) => {
                  setSubDraft((current) =>
                    !current.slug || current.slug === slugifyName(current.name)
                      ? { ...current, name, slug: slugifyName(name) }
                      : { ...current, name },
                  );
                }}
                onSubmit={() => createSub.mutate()}
                onCancel={() => setAddingUnder(null)}
              />
            ) : null}
            {open ? (
              children.length ? (
                <div className="sub-list">
                  {[...children]
                    .sort((a, b) => {
                      const aKind = a.kind === "service" ? 1 : 0;
                      const bKind = b.kind === "service" ? 1 : 0;
                      return aKind - bKind || (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
                    })
                    .map((child) => (
                    <CategoryBranch
                      key={child.id}
                      category={child}
                      canWrite={canWrite}
                      onEnable={(id) => setActive.mutate({ id, isActive: true })}
                      onDisable={(id, name) => {
                        if (window.confirm(`Disable “${name}”? It will be hidden from the public site.`)) {
                          setActive.mutate({ id, isActive: false });
                        }
                      }}
                      onDelete={(id, name) => {
                        if (
                          window.confirm(
                            `Permanently delete “${name}”? If it has listings, deletion will fail — disable it instead.`,
                          )
                        ) {
                          remove.mutate(id);
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No subcategories yet.
                </p>
              )
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function CategoryBranch({
  category,
  canWrite,
  onEnable,
  onDisable,
  onDelete,
}: {
  category: Category;
  canWrite: boolean;
  onEnable: (id: string) => void;
  onDisable: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const nested = category.children ?? [];
  return (
    <>
      <CategorySummary
        category={category}
        canWrite={canWrite}
        kind={nested.length ? "Subcategory group" : "Subcategory"}
        nested
        onEnable={() => onEnable(category.id)}
        onDisable={() => onDisable(category.id, category.name)}
        onDelete={() => onDelete(category.id, category.name)}
      />
      {nested.length ? (
        <div className="sub-list" style={{ marginLeft: "1rem" }}>
          {nested.map((child) => (
            <CategoryBranch
              key={child.id}
              category={child}
              canWrite={canWrite}
              onEnable={onEnable}
              onDisable={onDisable}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

function CategorySummary({
  category,
  canWrite,
  kind,
  nested,
  expanded,
  childCount,
  extraActions,
  onToggle,
  onEnable,
  onDisable,
  onDelete,
}: {
  category: Category;
  canWrite: boolean;
  kind: string;
  nested?: boolean;
  expanded?: boolean;
  childCount?: number;
  extraActions?: ReactNode;
  onToggle?: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onDelete: () => void;
}) {
  const active = category.isActive !== false;
  const preview = category.imageUrl || category.bannerUrl;
  return (
    <div className={`cat-summary${nested ? " nested" : ""}`}>
      {preview ? (
        <img className="thumb" src={preview} alt="" />
      ) : (
        <div className="thumb empty">No image</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row" style={{ gap: "0.5rem" }}>
          {onToggle ? (
            <button className="btn" type="button" onClick={onToggle}>
              {expanded ? "Hide" : "Show"} subcategories
              {typeof childCount === "number" ? ` (${childCount})` : ""}
            </button>
          ) : null}
          <strong>{category.name}</strong>
          <span className={`badge ${active ? "ok" : ""}`}>{active ? "Enabled" : "Disabled"}</span>
          <span className={`badge ${category.kind === "service" ? "" : "ok"}`}>
            {category.kind === "service" ? "Service professional" : "Supplier"}
          </span>
          <span className="muted">{kind}</span>
        </div>
        <p className="muted" style={{ margin: "0.25rem 0 0" }}>
          {category.description?.trim() || "No description yet"}
        </p>
        <p className="muted" style={{ margin: "0.15rem 0 0", fontSize: "0.8rem" }}>
          <code>{category.slug}</code>
          {category.imageUrl ? " · background set" : " · missing background"}
          {category.bannerUrl ? " · banner set" : " · missing banner"}
        </p>
      </div>
      <div className="actions">
        <Link className="btn primary" to={`/categories/${category.id}`}>
          Edit
        </Link>
        <Link className="btn" to={`/categories/${category.id}/forms`}>
          Forms
        </Link>
        {extraActions}
        {canWrite ? (
          active ? (
            <button className="btn" type="button" onClick={onDisable}>
              Disable
            </button>
          ) : (
            <button className="btn" type="button" onClick={onEnable}>
              Enable
            </button>
          )
        ) : null}
        {canWrite ? (
          <button className="btn danger" type="button" onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
