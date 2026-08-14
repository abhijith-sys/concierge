import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ApiError, api, hasPermission, type Category } from "../lib/api";
import { isPlatform, slugifyName } from "../lib/taxonomy";
import { useAuth } from "../context/auth";

export function CategoryDetailPage() {
  const { id } = useParams();
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

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  useEffect(() => {
    if (!category) return;
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setIcon(category.icon ?? "");
    setImageUrl(category.imageUrl ?? "");
    setSortOrder(String(category.sortOrder ?? 0));
  }, [category]);

  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");

  const save = useMutation({
    mutationFn: () =>
      api.updateCategory(category!.id, {
        name,
        slug,
        description: description.trim() || null,
        icon: icon.trim() || null,
        imageUrl: imageUrl.trim() || null,
        sortOrder: Number(sortOrder) || 0,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const createSub = useMutation({
    mutationFn: () =>
      api.createCategory({
        name: subName,
        slug: subSlug.trim() || slugifyName(subName),
        parentId: category!.id,
        isActive: true,
      }),
    onSuccess: async () => {
      setSubName("");
      setSubSlug("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const setActive = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => api.updateCategory(input.id, { isActive: input.isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const deactivate = useMutation({
    mutationFn: (targetId: string) => api.deleteCategory(targetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  if (!id) return <Navigate to="/categories" replace />;
  if (categories.isLoading) return <p className="muted">Loading…</p>;
  if (!category) return <p className="error">Category not found</p>;

  const children = category.children ?? [];
  const isMain = !category.parentId && !isPlatform(category);

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
            {category.isActive === false ? " · Inactive" : " · Active"}
          </p>
        </div>
        <div className="row">
          <Link className="btn primary" to={`/categories/${category.id}/forms`}>
            Configure forms
          </Link>
          {canWrite && category.isActive !== false ? (
            <button className="btn danger" type="button" onClick={() => deactivate.mutate(category.id)}>
              Deactivate
            </button>
          ) : null}
          {canWrite && category.isActive === false ? (
            <button className="btn" type="button" onClick={() => setActive.mutate({ id: category.id, isActive: true })}>
              Activate
            </button>
          ) : null}
        </div>
      </div>

      {canWrite ? (
        <form
          className="panel stack"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <strong>Edit</strong>
          <div className="row">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <input className="input" placeholder="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
            <input
              className="input"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ minWidth: "7rem" }}
            />
          </div>
          <input
            className="input"
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ minWidth: "100%" }}
          />
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="row">
            <button className="btn primary" type="submit" disabled={save.isPending}>
              Save
            </button>
            {save.isError ? (
              <span className="error">{save.error instanceof ApiError ? save.error.message : "Save failed"}</span>
            ) : null}
            {save.isSuccess ? <span className="ok">Saved</span> : null}
          </div>
        </form>
      ) : null}

      {isMain ? (
        <>
          {canWrite ? (
            <form
              className="panel row"
              onSubmit={(event) => {
                event.preventDefault();
                createSub.mutate();
              }}
            >
              <strong style={{ marginRight: "0.5rem" }}>Add subcategory</strong>
              <input
                className="input"
                placeholder="Name"
                value={subName}
                onChange={(e) => {
                  setSubName(e.target.value);
                  if (!subSlug || subSlug === slugifyName(subName)) setSubSlug(slugifyName(e.target.value));
                }}
                required
              />
              <input className="input" placeholder="Slug" value={subSlug} onChange={(e) => setSubSlug(e.target.value)} />
              <button className="btn primary" type="submit" disabled={!subName.trim() || createSub.isPending}>
                Add
              </button>
              {createSub.isError ? (
                <span className="error">
                  {createSub.error instanceof ApiError ? createSub.error.message : "Create failed"}
                </span>
              ) : null}
            </form>
          ) : null}

          <div className="panel" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Subcategory</th>
                  <th>Status</th>
                  <th>Fields</th>
                  <th>Providers</th>
                  <th>Listings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <tr key={child.id}>
                    <td>
                      <strong>{child.name}</strong>
                      <div className="muted">
                        <code>{child.slug}</code>
                      </div>
                    </td>
                    <td>{child.isActive === false ? "Inactive" : "Active"}</td>
                    <td>{child._count?.fields ?? "—"}</td>
                    <td>{child._count?.listings ?? "—"}</td>
                    <td>{child._count?.services ?? "—"}</td>
                    <td>
                      <div className="row">
                        <Link className="btn" to={`/categories/${child.id}`}>
                          View
                        </Link>
                        <Link className="btn primary" to={`/categories/${child.id}/forms`}>
                          Configure forms
                        </Link>
                        {canWrite && child.isActive !== false ? (
                          <button className="btn danger" type="button" onClick={() => deactivate.mutate(child.id)}>
                            Deactivate
                          </button>
                        ) : null}
                        {canWrite && child.isActive === false ? (
                          <button
                            className="btn"
                            type="button"
                            onClick={() => setActive.mutate({ id: child.id, isActive: true })}
                          >
                            Activate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {children.length === 0 ? <p className="muted">No subcategories yet.</p> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function findCategory(roots: Category[], id?: string): Category | undefined {
  if (!id) return undefined;
  for (const root of roots) {
    if (root.id === id) return root;
    const child = root.children?.find((item) => item.id === id);
    if (child) return { ...child, parentId: child.parentId ?? root.id };
  }
  return undefined;
}
