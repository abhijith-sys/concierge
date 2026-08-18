import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, type Business, type Service } from "../lib/api";
import { canAddItems, listingStatus, StatusBadge } from "../lib/status";
import { EmptyList } from "./EmptyList";
import { Button } from "./ui";

export function ProviderListingsTable({
  business,
  services,
  isLoading,
  onChanged,
}: {
  business?: Business;
  services?: Service[];
  isLoading?: boolean;
  onChanged?: () => void;
}) {
  const disable = useMutation({
    mutationFn: (service: Service) => api.updateService(service.id, { isActive: false }),
    onSuccess: () => onChanged?.(),
  });
  const enable = useMutation({
    mutationFn: (service: Service) => api.updateService(service.id, { isActive: true }),
    onSuccess: () => onChanged?.(),
  });
  const remove = useMutation({
    mutationFn: (service: Service) => api.deleteService(service.id),
    onSuccess: () => onChanged?.(),
  });

  const busyId =
    (disable.isPending && disable.variables?.id) ||
    (enable.isPending && enable.variables?.id) ||
    (remove.isPending && remove.variables?.id) ||
    "";

  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-line bg-surface-low text-xs font-bold uppercase tracking-wider text-ink-soft">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-ink-soft">
                Loading listings…
              </td>
            </tr>
          ) : services?.length ? (
            services.map((service) => {
              const status = listingStatus(service);
              const posted = service.approvalStatus === "approved" && service.isActive;
              const canEnable = service.approvalStatus === "approved" && !service.isActive;
              return (
                <tr key={service.id} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">
                    {service.name}
                    {service.approvalStatus === "rejected" && service.rejectionReason ? (
                      <p className="mt-1 text-xs font-normal text-red-700">{service.rejectionReason}</p>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {service.currency} {service.price}
                  </td>
                  <td className="px-4 py-3">{service.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link to={`/provider/listings/${service.id}/edit?business=${business?.id ?? service.businessId}`}>
                        <Button variant="outline" disabled={busyId === service.id}>
                          Edit
                        </Button>
                      </Link>
                      {posted ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyId === service.id}
                          onClick={() => disable.mutate(service)}
                        >
                          Disable
                        </Button>
                      ) : null}
                      {canEnable ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busyId === service.id}
                          onClick={() => enable.mutate(service)}
                        >
                          Enable
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busyId === service.id}
                        onClick={() => {
                          if (!window.confirm(`Delete “${service.name}”? This cannot be undone.`)) return;
                          remove.mutate(service);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5}>
                <EmptyList
                  compact
                  title={`No items yet${business ? ` for ${business.name}` : ""}`}
                  description={business && canAddItems(business) ? "Use Add item to create one." : undefined}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
