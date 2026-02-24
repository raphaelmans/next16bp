type ProfileCompleteness = {
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
};

export function isProfileComplete(
  profile: ProfileCompleteness | null | undefined,
): boolean {
  return !!profile?.displayName && (!!profile?.email || !!profile?.phoneNumber);
}
