{{#if @root.data.auth ~}}
CALL _toggleSubscriptionActiveState(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape @root.context.metaData.favourites.CampaignName}}},
  'Favourites'
);
{{else}}
SET @query=false;
{{/if ~}}