{{#if @root.data.auth ~}}
CALL _addSubscriptionParameters(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape @root.context.metaData.emailCampaignName}}},
  {{{mysqlEscape (
    querystringify (obj)
      keywords=@root.request.params.query.keywords
      regions=(sort @root.request.params.query.regions)
      work_types=(sort @root.request.params.query.work_types)
      client_groups=(sort @root.request.params.query.client_groups)
      services=(sort @root.request.params.query.services)
      age_groups=(sort @root.request.params.query.age_groups)
      availability=@root.request.params.query.availability
      distance=@root.request.params.query.distance
      lat=@root.request.params.query.lat
      lng=@root.request.params.query.lng
      location=@root.request.params.query.location
    )
  }}},
  {{{mysqlEscape (default @root.request.body.name "My saved search")}}},
  {{#if @root.request.body.subscribe}}1{{else}}0{{/if}}
);
{{else}}
SET @query=false;
{{/if ~}}