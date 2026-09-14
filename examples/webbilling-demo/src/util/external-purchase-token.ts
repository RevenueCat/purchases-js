export const RC_EXTERNAL_PURCHASE_TOKEN_ID_QUERY_PARAMETER =
  "rc_external_purchase_token_id";

export const appendExternalPurchaseTokenId = (
  searchParams: URLSearchParams,
  externalPurchaseTokenId: string,
) => {
  const normalizedTokenId = externalPurchaseTokenId.trim();
  if (normalizedTokenId) {
    searchParams.append(
      RC_EXTERNAL_PURCHASE_TOKEN_ID_QUERY_PARAMETER,
      normalizedTokenId,
    );
  }
};

export const getExternalPurchaseTokenId = (
  searchParams: URLSearchParams,
): string | undefined =>
  searchParams.get(RC_EXTERNAL_PURCHASE_TOKEN_ID_QUERY_PARAMETER) || undefined;
