{{#if @root.data.auth ~}}
CALL _addSubscriptionParameter(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape @root.context.metaData.favouritesCampaignName}}},
  {{{mysqlEscape 'id'}}},
  {{{mysqlEscape @root.request.params.query.id}}},
  'Favourites',
  NULL
);
{{else}}
SET @query=false;
{{/if ~}}
