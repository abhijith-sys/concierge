import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  CategoryEditorForm,
  draftFromCategory,
  emptyCategoryDraft,
  payloadFromDraft,
  type CategoryDraft,
} from "../components/CategoryEditorForm";
import { EmptyList } from "../components/EmptyList";
import { ApiError, api, hasPermission } from "../lib/api";
import { findCategory, isPlatform, slugifyName } from "../lib/taxonomy";
import { useAuth } from "../context/auth";

export function CategoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasPermission(user, "categories.write");

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: api.categories,
    enabled: Boolean(id),
  });

  const category = useMemo(() => findCategory(categories.data ?? [], id), [categories.data, id]);
  const parent = useMemo(() => {
    if (!category?.parentId) return null;
    return findCategory(categories.data ?? [], category.parentId);
  }, [categories.data, category]);

  const [draft, setDraft] = useState<CategoryDraft>(() => emptyCategoryDraft());
  const [subDraft, setSubDraft] = useState<CategoryDraft>(() => emptyCategoryDraft("1"));
  const [showAddSub, setShowAddSub] = useState(false);

  useEffect(() => {
    if (!category) return;
    setDraft(draftFromCategory(category));
  }, [category]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  }

  const save = useMutation({
    mutationFn: () => api.updateCategory(category!.id, payloadFromDraft(draft)),
    onSuccess: refresh,
  });

  const createSub = useMutation({
    mutationFn: () =>
      api.createCategory(payloadFromDraft(subDraft, { parentId: category!.id, isActive: true })),
    onSuccess: async () => {
      setSubDraft(emptyCategoryDraft("1"));
      setShowAddSub(false);
      await refresh();
    },
  });

  const setActive = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) =>
      api.updateCategory(input.id, { isActive: input.isActive }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (targetId: string) => api.deleteCategory(targetId, true),
    onSuccess: async (_, targetId) => {
      await refresh();
      if (targetId === category?.id) navigate("/categories", { replace: true });
    },
  });

  if (!id) return <Navigate to="/categories" replace />;
  if (categories.isLoading) return <p className="muted">Loading…</p>;
  if (!category) return <p className="error">Category not found</p>;

  const children = category.children ?? [];
  const isMain = !category.parentId && !isPlatform(category);
  const isSub = Boolean(category.parentId);
  const active = category.isActive !== false;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="muted" style={{ margin: 0 }}>
            <Link to="/categories">Categories</Link>
            {parent ? (
              <>
                {" / "}
                <Link to={`/categories/${parent.id}`}>{parent.name}</Link>
              </>
            ) : null}
          </p>
          <h2 style={{ margin: "0.35rem 0 0" }}>{category.name}</h2>
          <p className="muted">
            {isPlatform(category)
              ? "Platform common fields inherited by every category"
              : isMain
                ? "Main category"
                : "Subcategory"}
            {" · "}
            {isPlatform(category)
              ? null
              : category.kind === "service"
                ? "Service professional · "
                : "Supplier / shop · "}
            {active ? "Enabled" : "Disabled"}
          </p>
          {!isPlatform(category) ? (
            <p className="muted" style={{ margin: "0.75rem 0 0", maxWidth: "42rem" }}>
              Provider form fields appear on the shop profile. Listing form fields appear as extra details on each
              catalog item / offering page. Configure both under{" "}
              <Link to={`/categories/${category.id}/forms`}>forms</Link>.
            </p>
          ) : null}
        </div>
        <div className="actions">
          <Link className="btn" to={`/categories/${category.id}/forms`}>
            Configure forms
          </Link>
          {canWrite && !isPlatform(category) ? (
            active ? (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  if (window.confirm(`Disable “${category.name}”? It will be hidden from the public site.`)) {
                    setActive.mutate({ id: category.id, isActive: false });
                  }
                }}
              >
                Disable
              </button>
            ) : (
              <button className="btn" type="button" onClick={() => setActive.mutate({ id: category.id, isActive: true })}>
                Enable
              </button>
            )
          ) : null}
          {canWrite && !isPlatform(category) ? (
            <button
              className="btn danger"
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Permanently delete “${category.name}”? If it is in use, deletion will fail — disable it instead.`,
                  )
                ) {
                  remove.mutate(category.id);
                }
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
      {remove.isError && remove.variables === category.id ? (
        <p className="error">{remove.error instanceof ApiError ? remove.error.message : "Delete failed"}</p>
      ) : null}

      {canWrite && !isPlatform(category) ? (
        <CategoryEditorForm
          title="Edit category"
          submitLabel={save.isPending ? "Saving…" : "Save changes"}
          draft={draft}
          isSubcategory={isSub}
          pending={save.isPending}
          error={save.error instanceof ApiError ? save.error.message : save.isError ? "Save failed" : undefined}
          success={save.isSuccess ? "Saved" : undefined}
          onChange={setDraft}
          onSubmit={() => save.mutate()}
        />
      ) : null}

      {!isPlatform(category) ? (
        <>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>{isMain ? "Subcategories" : "Nested subcategories"}</h3>
            {canWrite ? (
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setShowAddSub((open) => !open);
                  setSubDraft(emptyCategoryDraft(String(children.length + 1), category.kind === "service" ? "service" : "supplier"));
                }}
              >
                {showAddSub ? "Close" : "Add subcategory"}
              </button>
            ) : null}
          </div>
          {canWrite && showAddSub ? (
            <CategoryEditorForm
              title="Add subcategory"
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
              onCancel={() => setShowAddSub(false)}
            />
          ) : null}
          <div className="stack">
            {children.map((child) => (
              <div key={child.id} className="cat-card">
                <div className="cat-summary nested">
                  {child.imageUrl || child.bannerUrl ? (
                    <img className="thumb" src={child.imageUrl || child.bannerUrl || ""} alt="" />
                  ) : (
                    <div className="thumb empty">No image</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="row" style={{ gap: "0.5rem" }}>
                      <strong>{child.name}</strong>
                      <span className={`badge ${child.isActive === false ? "" : "ok"}`}>
                        {child.isActive === false ? "Disabled" : "Enabled"}
                      </span>
                    </div>
                    <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                      {child.description?.trim() || "No description yet"}
                    </p>
                  </div>
                  <div className="actions">
                    <Link className="btn primary" to={`/categories/${child.id}`}>
                      Edit
                    </Link>
                    <Link className="btn" to={`/categories/${child.id}/forms`}>
                      Forms
                    </Link>
                    {canWrite && child.isActive !== false ? (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Disable “${child.name}”?`)) {
                            setActive.mutate({ id: child.id, isActive: false });
                          }
                        }}
                      >
                        Disable
                      </button>
                    ) : null}
                    {canWrite && child.isActive === false ? (
                      <button
                        className="btn"
                        type="button"
                        onClick={() => setActive.mutate({ id: child.id, isActive: true })}
                      >
                        Enable
                      </button>
                    ) : null}
                    {canWrite ? (
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Permanently delete “${child.name}”?`)) {
                            remove.mutate(child.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {children.length === 0 ? <EmptyList compact title="No subcategories yet." /> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

