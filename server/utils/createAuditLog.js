await createAuditLog({
    user: req.user,
    action: "TEAM_MEMBER_CREATED",
    resourceType: "team",
    description: "New team member added",
    req,
});