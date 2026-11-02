/**
 * Interface labels only. Everything legally meaningful (notice title, purposes, data items, links)
 * comes from the notice returned by the API, in the principal's language.
 */
export type RequestKind = "access" | "correction" | "completion" | "updating" | "erasure" | "nomination" | "grievance";

export const REQUEST_KINDS: RequestKind[] = ["access", "correction", "completion", "updating", "erasure", "nomination", "grievance"];

export interface Labels {
  loading: string;
  error: string;
  saveChoices: string;
  acceptAll: string;
  rejectAll: string;
  saved: string;
  neededForService: string;
  noConsentNeeded: string;
  dataUsed: string;
  withdrawLink: string;
  rightsLink: string;
  boardLink: string;
  preferencesTitle: string;
  granted: string;
  denied: string;
  withdrawn: string;
  notDecided: string;
  withdraw: string;
  give: string;
  updated: string;
  history: string;
  status: string;
  requestTitle: string;
  requestKind: string;
  requestDetails: string;
  nomineeName: string;
  nomineeContact: string;
  nomineeRelationship: string;
  submitRequest: string;
  requestSubmitted: string;
  dueBy: string;
  yourRequests: string;
  kinds: Record<RequestKind, string>;
}

export const defaultLabels: Labels = {
  loading: "Loading…",
  error: "Something went wrong. Please try again.",
  saveChoices: "Save my choices",
  acceptAll: "Accept all",
  rejectAll: "Reject all",
  saved: "Your choices have been saved.",
  neededForService: "Needed to provide the service",
  noConsentNeeded: "We process this without asking for consent, on a legal basis other than consent.",
  dataUsed: "Data used",
  withdrawLink: "Withdraw consent",
  rightsLink: "Your rights",
  boardLink: "Complain to the Data Protection Board",
  preferencesTitle: "Your consent choices",
  granted: "Given",
  denied: "Declined",
  withdrawn: "Withdrawn",
  notDecided: "Not decided",
  withdraw: "Withdraw",
  give: "Give consent",
  updated: "Updated",
  history: "History of your choices",
  status: "Status",
  requestTitle: "Make a request about your data",
  requestKind: "What would you like to do?",
  requestDetails: "Details",
  nomineeName: "Nominee's name",
  nomineeContact: "Nominee's email or phone",
  nomineeRelationship: "Relationship (optional)",
  submitRequest: "Submit request",
  requestSubmitted: "Request received. Reference:",
  dueBy: "We aim to respond by",
  yourRequests: "Your requests",
  kinds: {
    access: "Get a summary of my data",
    correction: "Correct my data",
    completion: "Complete my data",
    updating: "Update my data",
    erasure: "Erase my data",
    nomination: "Nominate someone to act for me",
    grievance: "Raise a grievance",
  },
};
