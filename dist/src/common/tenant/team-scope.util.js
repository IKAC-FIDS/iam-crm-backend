"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTeamScope = hasTeamScope;
exports.userTeamScopeWhere = userTeamScopeWhere;
exports.userTeamFilterWhere = userTeamFilterWhere;
exports.userMatchesTeam = userMatchesTeam;
function hasTeamScope(user) {
    return Boolean(user.teamId || user.team);
}
function userTeamScopeWhere(user) {
    const or = [];
    if (user.teamId) {
        or.push({ teamId: user.teamId });
    }
    if (user.team) {
        or.push({ team: user.team });
    }
    return or.length ? { OR: or } : { id: { in: [] } };
}
function userTeamFilterWhere(values) {
    const normalized = values.map((value) => value.trim()).filter(Boolean);
    if (!normalized.length) {
        return {};
    }
    return {
        OR: [
            { teamId: { in: normalized } },
            { team: { in: normalized } },
            { teamRef: { code: { in: normalized } } },
            { teamRef: { name: { in: normalized } } },
        ],
    };
}
function userMatchesTeam(candidate, user) {
    return Boolean((user.teamId && candidate.teamId === user.teamId) ||
        (user.team && candidate.team === user.team));
}
//# sourceMappingURL=team-scope.util.js.map