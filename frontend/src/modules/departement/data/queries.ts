import { useQuery } from "@tanstack/react-query";
import { getDepartement } from "./client";

export function useDepartement(id: string | undefined) {
    return useQuery({
        queryKey: ["departement", id],
        queryFn: () => getDepartement(id!),
        enabled: Boolean(id),
    });
}