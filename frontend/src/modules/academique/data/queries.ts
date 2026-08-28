"use client";

import { useQuery } from "@tanstack/react-query";

import { listFormations } from "./client";

export function useFormations() {
    return useQuery({
        queryKey: ["formations"],
        queryFn: listFormations,
    });
}