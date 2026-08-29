"use client";

import { useQuery } from "@tanstack/react-query";

import { listEnseignants } from "./client";

export function useEnseignants() {
    return useQuery({
        queryKey: ["enseignants"],
        queryFn: listEnseignants,
    });
}