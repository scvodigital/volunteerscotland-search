{{#if @root.data.auth ~}}
CALL _getSubscriptionParameters(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape @root.context.metaData.registeredInterestCampaignName}}},
  'Registered Interest'
);
{{else}}
SET @query=false;
{{/if ~}}