import { getRouteApi } from "@tanstack/react-router";

import { SavedSplitPage } from "@/routes/SavedSplitPage";

const routeApi = getRouteApi("/split/$splitId");

export function SavedSplitRoute() {
  const { splitId } = routeApi.useParams();

  return <SavedSplitPage splitId={splitId} />;
}
