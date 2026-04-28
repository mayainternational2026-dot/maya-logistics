import {
  useGetStaffActivity,
  getGetStaffActivityQueryKey,
} from "@workspace/api-client-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Award } from "lucide-react";
import { formatNPR } from "@/lib/utils";

export default function StaffActivity() {
  const { data, isLoading } = useGetStaffActivity({
    query: { queryKey: getGetStaffActivityQueryKey() },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary">Staff Activity</h1>
        <p className="mt-1 text-gray-600">
          Performance overview for the Maya operations team.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (data ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No staff activity recorded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Shipments Created</th>
                  <th className="px-6 py-4">Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((row, i) => (
                  <tr
                    key={row.userId}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {i === 0 && <Award className="h-4 w-4 text-amber-500" />}
                        <span className="font-semibold text-secondary">
                          #{i + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-secondary">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{row.email}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {row.shipmentsCreated}
                    </td>
                    <td className="px-6 py-4 font-semibold text-secondary">
                      {formatNPR(row.revenueGenerated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <WhatsAppButton />
    </div>
  );
}
