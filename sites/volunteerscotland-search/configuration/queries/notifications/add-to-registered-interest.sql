{{#if @root.data.auth ~}}
CALL _addSubscriptionParameter(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape @root.context.metaData.registeredInterestCampaignName}}},
  {{{mysqlEscape 'id'}}},
  {{{mysqlEscape @root.request.params.query.id}}},
  'Registered Interest',
  NULL
);
{{else}}
SET @query=false;
{{/if ~}}
