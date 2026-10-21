export type DomainId = "cloud" | "architecture" | "governance";

export interface Domain {
  id: DomainId;
  name: string;
  /** Approximate share of the public AZ-900 skills outline (midpoint of the published range). */
  weight: number;
  revise: string;
}

export const DOMAINS: Domain[] = [
  {
    id: "cloud",
    name: "Cloud Concepts",
    weight: 0.275,
    revise:
      "Revise cloud models (public, private, hybrid), service types (IaaS, PaaS, SaaS), shared responsibility and the consumption-based pricing model.",
  },
  {
    id: "architecture",
    name: "Azure Architecture and Services",
    weight: 0.375,
    revise:
      "Revise regions, availability zones, resource groups, subscriptions, and core compute, networking, storage and identity services.",
  },
  {
    id: "governance",
    name: "Azure Management and Governance",
    weight: 0.325,
    revise:
      "Revise cost management, Azure Policy, resource locks, tags, role-based access control and monitoring tools.",
  },
];

export const DOMAIN_BY_ID: Record<DomainId, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d]),
) as Record<DomainId, Domain>;
