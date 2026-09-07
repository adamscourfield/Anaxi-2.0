-- SLT no longer automatically has global leave-approval access (see lib/rbac.ts
-- and lib/loa.ts) -- it's now opt-in per person, same as HOD/HR/Leader. This
-- grandfathers existing SLT staff so nobody loses the access they currently
-- have; future SLT staff start without it until explicitly granted.
UPDATE "User" SET "canApproveAllLoa" = true WHERE "role" = 'SLT';
