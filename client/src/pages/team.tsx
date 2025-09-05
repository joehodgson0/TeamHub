import TeamManagementSection from "@/components/team/team-management-section";

export default function Team() {
  return (
    <div className="space-y-6" data-testid="team-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-team">Team Management</h1>
      </div>

      <TeamManagementSection />
    </div>
  );
}
