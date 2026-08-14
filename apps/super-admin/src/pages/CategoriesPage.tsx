import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api, hasPermission, type Category } from "../lib/api";
import { isPlatform, slugifyName } from "../lib/taxonomy";
import { useAuth } from "../context/auth";

export function CategoriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canWrite = hasPermission(user, "categories.write");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState("1");

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: api.categories,
    enabled: canWrite || hasPermission(user, "category_fields.write"),
  });

  const roots = (categories.data ?? []).filter((category) => !isPlatform(category));
  const platform = (categories.data ?? []).find(isPlatform);

  const create = useMutation({
    mutationFn: () =>
      api.createCategory({
        name,
        slug: slug.trim() || slugifyName(name),
        description: description.trim() || null,
        icon: icon.trim() || null,
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      }),
    onSuccess: async () => {
      setName("");
      setSlug("");
      setDescription("");
      setIcon("");
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
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  if (!canWrite && !hasPermission(user, "category_fields.write")) {
    return <p className="error">Missing categories.write permission</p>;
  }

  return (
    <div className="stack">
      <div>
        <h2 style={{ margin: 0 }}>Categories</h2>
        <p className="muted">
          Main categories, subcategories, and form configuration. Web reads this from the API — do not hardcode
          taxonomy in the public app.
        </p>
      </div>

      {platform ? (
        <div className="panel row" style={{ justifyContent: "space-between" }}>
          <div>
            <strong>Platform common fields</strong>
            <p className="muted" style={{ margin: "0.25rem 0 0" }}>
              Shared provider and listing fields inherited by every category. Hidden from public browse.
            </p>
          </div>
          <Link className="btn primary" to={`/categories/${platform.id}/forms`}>
            Configure common forms
          </Link>
        </div>
      ) : null}

      {canWrite ? (
        <form
          className="panel stack"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <strong>Create main category</strong>
          <div className="row">
            <input
              className="input"
              placeholder="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === slugifyName(name)) setSlug(slugifyName(e.target.value));
              }}
              required
            />
            <input className="input" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <input className="input" placeholder="Icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
            <input
              className="input"
              type="number"
              min={0}
              placeholder="Order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ minWidth: "7rem" }}
            />
          </div>
          <textarea
            className="textarea"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="row">
            <button className="btn primary" type="submit" disabled={!name.trim() || create.isPending}>
              Create category
            </button>
            {create.isError ? (
              <span className="error">{create.error instanceof ApiError ? create.error.message : "Create failed"}</span>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Icon</th>
              <th>Status</th>
              <th>Subcategories</th>
              <th>Providers</th>
              <th>Listings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roots.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                canWrite={canWrite}
                onActivate={() => setActive.mutate({ id: category.id, isActive: true })}
                onDeactivate={() => deactivate.mutate(category.id)}
              />
            ))}
          </tbody>
        </table>
        {categories.isLoading ? <p className="muted">Loading…</p> : null}
        {categories.isError ? <p className="error">Failed to load categories</p> : null}
        {!categories.isLoading && roots.length === 0 ? <p className="muted">No main categories yet.</p> : null}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  canWrite,
  onActivate,
  onDeactivate,
}: {
  category: Category;
  canWrite: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const active = category.isActive !== false;
  return (
    <tr>
      <td>
        <strong>{category.name}</strong>
      </td>
      <td>
        <code>{category.slug}</code>
      </td>
      <td>{category.icon || "—"}</td>
      <td>{active ? "Active" : "Inactive"}</td>
      <td>{category._count?.children ?? category.children?.length ?? 0}</td>
      <td>{category._count?.listings ?? "—"}</td>
      <td>{category._count?.services ?? "—"}</td>
      <td>
        <div className="row">
          <Link className="btn" to={`/categories/${category.id}`}>
            View
          </Link>
          <Link className="btn" to={`/categories/${category.id}/forms`}>
            Forms
          </Link>
          {canWrite ? (
            active ? (
              <button className="btn danger" type="button" onClick={onDeactivate}>
                Deactivate
              </button>
            ) : (
              <button className="btn" type="button" onClick={onActivate}>
                Activate
              </button>
            )
          ) : null}
        </div>
      </td>
    </tr>
  );
}
