# TeamHub Scenarios

**Version:** 1.0  
**Date:** September 04, 2025  
**Author:** Joseph Hodgson

## Registration

### Objective

Verify that the TeamHub registration process works correctly for email/password sign-up, external authentication, and the post-registration role selection wizard.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A valid email address for testing (e.g., testuser@example.com).
- Access to external authentication accounts (e.g., Google, Apple).
- Test environment cleared of any existing account with the test email.

### Test Case 1: Registration with Email and Password

#### Navigate to Login Page

- Open the TeamHub application in a web browser.
- Verify the login page loads and displays the "Sign Up" button.

#### Access Registration Form

- Click the "Sign Up" button.
- Verify the registration form appears with fields for email and password.

#### Enter Valid Credentials

- Input a valid email (e.g., testuser@example.com).
- Input a password meeting requirements (e.g., 8+ characters, mix of letters, numbers, symbols like "Test123!").
- Verify the "Sign Up with Email" button becomes active.

#### Submit Registration

- Click "Sign Up with Email."
- Verify a confirmation message appears: "Verification email sent!"
- Check the test email inbox for the verification link.

#### Verify Email

- Open the verification email and click the link.
- Verify the link redirects to TeamHub and confirms the account (e.g., redirects to login or wizard).

#### Error Handling (Optional)

- Attempt registration with an already-used email.
- Verify an error message appears (e.g., "Email already in use").
- Attempt registration with an invalid password (e.g., "abc").
- Verify an error message appears (e.g., "Password must be at least 8 characters").

### Test Case 2: Registration with External Authentication

#### Access External Auth Options

- Navigate to the registration page via the "Sign Up" button.
- Verify external authentication buttons (e.g., Google, Apple) are visible.

#### Sign Up with Google

- Click the "Sign Up with Google" button.
- Log in with a test Google account (e.g., testuser@gmail.com).
- Authorize TeamHub to access the account.
- Verify redirection back to TeamHub with the account created.

#### Sign Up with Apple (Optional)

- Repeat the process for Apple authentication if supported.
- Verify successful account creation and redirection.

#### Error Handling (Optional)

- Attempt external auth with a cancelled authorization.
- Verify the app returns to the registration page with no account created.

### Test Case 3: Post-Registration Role Selection Wizard

#### Access Wizard

- Complete registration via email or external auth.
- Verify the role selection wizard appears post-registration.

#### Select Single Role

- Select "Coach/Manager" from the multi-select list.
- Click "Next."
- Verify the app proceeds to the dashboard with coach-specific features enabled.

#### Select Multiple Roles

- Repeat registration with a new email or external auth.
- Select both "Coach/Manager" and "Parent/Guardian."
- Click "Next."
- Verify the dashboard reflects both roles (e.g., access to team scheduling and player updates).

#### No Selection (Optional)

- Attempt to click "Next" without selecting a role.
- Verify an error or prompt appears (e.g., "Please select at least one role").

### Expected Outcomes

- Email registration completes with valid credentials and email verification.
- External authentication creates an account without manual email/password input.
- Role selection wizard correctly assigns user roles and tailors the dashboard.
- Error messages display appropriately for invalid inputs or actions.

### Notes

- Record any deviations (e.g., UI glitches, missing error messages) with screenshots.
- Test across browsers (Chrome, Firefox, Safari) to ensure compatibility.
- If the app supports mobile, repeat key steps on iOS/Android.
- Update placeholders (e.g., URLs, email addresses) with your test environment details.

---

## Create Team

### Objective

Verify that the TeamHub team creation process works correctly for users who selected "Coach/Manager" in the registration wizard. This includes validating the club unique code input, successful team creation under an existing club, and error handling for invalid codes.

### Prerequisites

- A TeamHub account registered as a Coach/Manager (use the registration process from previous tests if needed).
- Access to the TeamHub application (URL: [insert application URL]).
- At least one pre-created club with a known unique 8-character alphanumeric code (e.g., "ABC123XY" for a valid club).
- An invalid club code for testing (e.g., "INVALID1").
- Test environment with clubs manually created and assigned codes.

### Test Case 1: Successful Team Creation with Valid Club Code

#### Log In as Coach/Manager

- Open the TeamHub application in a web browser.
- Log in using credentials for a Coach/Manager account.
- Verify the dashboard loads with coach-specific features (e.g., team management options).

#### Navigate to Team Creation Page

- From the dashboard, locate and click the "Create Team" or equivalent button (e.g., under "Teams" menu).
- Verify the team creation form appears, including a field for the club unique code.

#### Enter Valid Club Code and Team Details

- Input the valid 8-character club code (e.g., "ABC123XY").
- Fill in other required team details (e.g., team name like "Youth Soccer Team", age group, sport type – assume standard fields if not specified).
- Verify the form validates inputs (e.g., no errors on valid data).

#### Submit Team Creation

- Click the "Create Team" or "Submit" button.
- Verify a success message appears (e.g., "Team created successfully under club [Club Name]").
- Confirm the team is listed in the dashboard or club-associated teams, and is linked to the correct club.

### Test Case 2: Team Creation with Invalid Club Code

#### Log In and Navigate

- Repeat steps 1-2 from Test Case 1 to reach the team creation form.

#### Enter Invalid Club Code

- Input an invalid 8-character code (e.g., "INVALID1").
- Fill in other required team details as in Test Case 1.

#### Submit and Verify Error

- Click the "Create Team" or "Submit" button.
- Verify an error message appears: "A club with code [INVALID1] can not be found."
- Confirm no team is created, and the form remains editable for corrections.

### Test Case 3: Edge Cases and Validations (Optional)

#### Invalid Code Format

- Attempt to input a code shorter than 8 characters (e.g., "ABC12").
- Verify form validation prevents submission or shows an error (e.g., "Code must be 8 alphanumeric characters").

#### Non-Alphanumeric Code

- Input a code with special characters (e.g., "ABC123!@").
- Verify an error for invalid format.

#### Empty Code Field

- Leave the club code field blank.
- Attempt submission and verify a required field error.

#### Case Sensitivity (If Applicable)

- If codes are case-sensitive, test with mixed case (e.g., "AbC123Xy" vs. "abc123xy").
- Verify behavior matches expected (success or error based on club data).

### Expected Outcomes

- Valid club code results in team creation under the specified club.
- Invalid club code triggers the exact error message without creating a team.
- Form validations handle input errors appropriately.
- No unauthorized access or creation for non-Coach/Manager users (test by attempting with a Parent/Guardian account if available).

### Notes

- Record any deviations (e.g., UI issues, unexpected errors) with screenshots and logs.
- Test across browsers (Chrome, Firefox, Safari) and devices (desktop, mobile) for compatibility.
- Ensure clubs are pre-created manually in the test environment before running these tests.
- Update placeholders (e.g., URLs, codes, field names) with your actual app details.
- If additional team fields are required (e.g., team logo, description), incorporate them into the steps as needed.

---

## Parent/Guardian Registration and Player Association

### Objective

Verify the registration process for a Parent/Guardian in TeamHub and the subsequent process of adding one or more players to teams using unique 8-character alphanumeric team codes. Validate successful player association and error handling for invalid team codes.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A valid email address for testing Parent/Guardian registration (e.g., parenttest@example.com).
- At least two pre-created teams with known 8-character alphanumeric codes (e.g., "TEAM123X" and "TEAM456Y").
- An invalid team code for testing (e.g., "INVALID2").
- Test environment with clubs and teams manually created, and teams assigned unique codes.
- No existing account for the test email.

### Test Case 1: Parent/Guardian Registration

#### Navigate to Login Page

- Open the TeamHub application in a web browser.
- Verify the login page loads and displays the "Sign Up" button.

#### Access Registration Form

- Click the "Sign Up" button.
- Verify the registration form appears with fields for email and password.

#### Enter Valid Credentials

- Input a valid email (e.g., parenttest@example.com).
- Input a password meeting requirements (e.g., 8+ characters, mix of letters, numbers, symbols like "Parent456!").
- Verify the "Sign Up with Email" button becomes active.

#### Submit Registration

- Click "Sign Up with Email."
- Verify a confirmation message appears: "Verification email sent!"
- Check the test email inbox for the verification link.

#### Verify Email

- Open the verification email and click the link.
- Verify the link redirects to TeamHub and confirms the account.

#### Complete Role Selection Wizard

- After verification, verify the role selection wizard appears.
- Select "Parent/Guardian" from the multi-select list (do not select "Coach/Manager").
- Click "Next."
- Verify the dashboard loads with parent-specific features (e.g., player management options).

#### Error Handling (Optional)

- Attempt registration with an already-used email.
- Verify an error message appears (e.g., "Email already in use").
- Attempt with an invalid password (e.g., "abc").
- Verify an error message appears (e.g., "Password must be at least 8 characters").

### Test Case 2: Adding Players to Teams

#### Log In as Parent/Guardian

- Log in with the Parent/Guardian account credentials.
- Verify the dashboard loads with access to player management (e.g., "Add Player" button or menu).

#### Navigate to Add Player Form

- Click the "Add Player" or equivalent button.
- Verify the form appears with fields for player name, date of birth, and team code.

#### Add First Player with Valid Team Code

Input player details:
- Name: e.g., "John Smith"
- Date of Birth: e.g., "01/15/2015" (use correct format, e.g., MM/DD/YYYY).
- Team Code: Valid code "TEAM123X".
- Click "Submit" or "Add Player."
- Verify a success message appears (e.g., "Player John Smith added to team").
- Confirm the player is listed in the parent's dashboard and associated with the correct team.

#### Add Second Player to a Different Team

- Return to the "Add Player" form.
Input new player details:
- Name: e.g., "Emma Smith"
- Date of Birth: e.g., "03/22/2013".
- Team Code: Valid code "TEAM456Y".
- Click "Submit" or "Add Player."
- Verify a success message and confirm Emma is associated with the second team.

#### Add Player with Invalid Team Code

- Return to the "Add Player" form.
Input player details:
- Name: e.g., "Alex Brown"
- Date of Birth: e.g., "07/10/2014".
- Team Code: Invalid code "INVALID2".
- Click "Submit" or "Add Player."
- Verify an error message appears: "No team found with code INVALID2."
- Confirm no player is added.

### Test Case 3: Edge Cases and Validations (Optional)

#### Invalid Team Code Format

- Input a team code shorter than 8 characters (e.g., "TEAM12").
- Verify form validation prevents submission or shows an error (e.g., "Code must be 8 alphanumeric characters").

#### Non-Alphanumeric Team Code

- Input a code with special characters (e.g., "TEAM12!@").
- Verify an error for invalid format.

#### Empty or Missing Fields

- Attempt submission with empty name, date of birth, or team code.
- Verify required field errors appear for each missing field.

#### Invalid Date of Birth

- Input an invalid date (e.g., "13/45/2010" or future date like "01/01/2026").
- Verify an error for invalid date format or range.

#### Multiple Players, Same Team

- Add another player with the same team code as the first (e.g., "TEAM123X").
- Verify the player is added successfully to the same team.

### Expected Outcomes

- Parent/Guardian registration completes successfully with email verification and role selection.
- Players are correctly associated with teams when valid 8-character team codes are provided.
- Invalid team codes trigger the exact error message: "No team found with code [code]."
- Form validations handle incorrect inputs appropriately.
- Multiple players can be added, and players can be associated with different teams.

---

## Add Fixture as a Manager

### TeamHub Event Creation and Parent Dashboard View Manual Testing Steps

### Objective

Verify that a Coach/Manager can create an event (match, friendly, training, tournament, or social event) for a team, and that Parent/Guardian users can view the event on their dashboard. Validate event creation with required and optional fields and ensure correct visibility for parents.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A Coach/Manager account with a team already created (e.g., team with code "TEAM123X").
- A Parent/Guardian account with at least one player associated with the team (e.g., "John Smith" on "TEAM123X").
- Test environment with clubs and teams manually created, and team codes assigned.
- Both accounts (Coach/Manager and Parent/Guardian) are registered and verified.

### Test Case 1: Event Creation by Coach/Manager

#### Log In as Coach/Manager

- Open the TeamHub application in a web browser.
- Log in using Coach/Manager account credentials.
- Verify the dashboard loads with team management features (e.g., team list, event creation options).

#### Navigate to Event Creation

- From the dashboard, select the team (e.g., "TEAM123X") or navigate to the team management section.
- Click the "Add Event" or equivalent button.
- Verify the event creation form appears with fields for event type, name, location, date and time, opponent (optional), and additional information.

#### Create Event with All Fields

Fill in the event details:
- Event Type: Select "Match" from a dropdown (options: Match, Friendly, Training, Tournament, Social Event).
- Name: e.g., "League Game vs. Rivals".
- Location: e.g., "City Stadium, 123 Main St".
- Date and Time: e.g., "09/20/2025 10:00 AM" (use correct format, e.g., MM/DD/YYYY HH:MM).
- Opponent: e.g., "Rival FC".
- Additional Information: e.g., "Bring water and shin guards."
- Click "Create Event" or "Submit."
- Verify a success message appears (e.g., "Event created successfully").
- Confirm the event is listed in the team's event calendar or dashboard.

#### Create Event without Optional Opponent Field

- Return to the "Add Event" form.
Fill in:
- Event Type: Select "Training".
- Name: e.g., "Weekly Practice".
- Location: e.g., "Training Field A".
- Date and Time: e.g., "09/22/2025 4:00 PM".
- Opponent: Leave blank.
- Additional Information: e.g., "Focus on passing drills."
- Click "Create Event" or "Submit."
- Verify a success message and confirm the event is listed without an opponent.

### Test Case 2: Parent/Guardian Viewing Events

#### Log In as Parent/Guardian

- Open the TeamHub application in a new browser session.
- Log in using Parent/Guardian account credentials (with a player on "TEAM123X").
- Verify the dashboard loads with parent-specific features (e.g., player and team event visibility).

#### Check Dashboard for Events

- Navigate to the dashboard or team section for the player's team (e.g., "TEAM123X").
- Verify both events ("League Game vs. Rivals" and "Weekly Practice") appear in the event list or calendar.
- Confirm event details are displayed correctly: Name, location, date, time, opponent (if provided), and additional information.

#### Verify Event Accessibility

- Click on each event to view details (if applicable).
- Verify all fields match the input from Test Case 1 (e.g., "Match" shows opponent "Rival FC", "Training" shows no opponent).
- Confirm the Parent/Guardian cannot edit or delete the event (read-only access).

### Test Case 3: Edge Cases and Validations (Optional)

#### Missing Required Fields

- As Coach/Manager, attempt to submit an event without: Name, location, or date/time.
- Verify form validation prevents submission and shows errors (e.g., "Name is required", "Date and time are required").

#### Invalid Date/Time

- Input a past date (e.g., "09/01/2024") or invalid format (e.g., "13/45/2025").
- Verify an error appears (e.g., "Date must be in the future" or "Invalid date format").

#### Event Type Validation

- Verify the event type dropdown only allows valid options (Match, Friendly, Training, Tournament, Social Event).
- Attempt submission with no event type selected (if possible).
- Verify an error for missing event type.

#### Parent/Guardian Dashboard for Non-Associated Team

- Log in with a Parent/Guardian account not associated with "TEAM123X".
- Verify the events for "TEAM123X" do not appear on their dashboard.

### Expected Outcomes

- Coach/Manager can create events with required fields (name, location, date/time, event type) and optional fields (opponent, additional information).
- Events appear correctly on the Parent/Guardian dashboard for associated teams.
- Parent/Guardian users have read-only access to event details.
- Form validations handle missing or invalid inputs appropriately.
- Events are only visible to parents of players associated with the team.

### Notes

- Record deviations (e.g., UI glitches, incorrect event details) with screenshots and logs.
- Test across browsers (Chrome, Firefox, Safari) and devices (desktop, mobile) for compatibility.
- Ensure the team ("TEAM123X") and associated player exist in the test environment.
- Update placeholders (e.g., URLs, team codes, field formats) with actual app details.
- Verify that non-Coach/Manager accounts (e.g., Parent/Guardian) cannot access the event creation feature.

---

## Event Availability

### Objective

Verify that a Parent/Guardian can mark a player's availability for events in TeamHub and that a Coach/Manager can view the availability status for each event. Validate the availability marking process and visibility of statuses.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A Coach/Manager account with a team created (e.g., team with code "TEAM123X") and at least two events created (e.g., "League Game vs. Rivals" and "Weekly Practice").
- A Parent/Guardian account with at least two players associated with the team (e.g., "John Smith" and "Emma Smith" on "TEAM123X").
- Test environment with clubs, teams, and events manually created, and team codes assigned.
- Both accounts (Coach/Manager and Parent/Guardian) are registered and verified.

### Test Case 1: Parent/Guardian Marking Player Availability

#### Log In as Parent/Guardian

- Open the TeamHub application in a web browser.
- Log in using Parent/Guardian account credentials (with players "John Smith" and "Emma Smith" on "TEAM123X").
- Verify the dashboard loads with parent-specific features (e.g., player and team event visibility).

#### Navigate to Event List

- Navigate to the dashboard or team section for "TEAM123X."
- Verify the events (e.g., "League Game vs. Rivals" and "Weekly Practice") are listed with player management options.

#### Mark Availability for First Player

- Select the "League Game vs. Rivals" event.
- For "John Smith," locate the availability option (e.g., dropdown or toggle with options like "Available," "Not Available").
- Set availability to "Available."
- Click "Save" or "Submit" (or equivalent).
- Verify a confirmation message appears (e.g., "Availability updated for John Smith").
- Confirm the event now shows "John Smith" as "Available."

#### Mark Different Availability for Second Player

- For the same event ("League Game vs. Rivals"), set "Emma Smith" availability to "Not Available."
- Click "Save" or "Submit."
- Verify a confirmation message and confirm "Emma Smith" is marked as "Not Available."

#### Mark Availability for Second Event

- Select the "Weekly Practice" event.
- Set "John Smith" to "Not Available" and "Emma Smith" to "Available."
- Click "Save" or "Submit."
- Verify confirmation and correct availability statuses for both players.

### Test Case 2: Coach/Manager Viewing Player Availability

#### Log In as Coach/Manager

- Open the TeamHub application in a new browser session.
- Log in using Coach/Manager account credentials for "TEAM123X."
- Verify the dashboard loads with team management features.

#### Navigate to Event Details

- Navigate to the team's event list or calendar for "TEAM123X."
- Select the "League Game vs. Rivals" event.
- Verify the event details page shows player availability:
  - "John Smith" marked as "Available."
  - "Emma Smith" marked as "Not Available."
- Confirm the display is clear (e.g., list, table, or icons showing availability status).

#### Check Second Event

- Select the "Weekly Practice" event.
- Verify the availability shows:
  - "John Smith" marked as "Not Available."
  - "Emma Smith" marked as "Available."
- Confirm all players on the team are listed with their respective statuses.

#### Verify Read-Only Access for Manager

- Attempt to edit availability as the Coach/Manager.
- Verify the Coach/Manager cannot modify player availability (read-only access).

### Test Case 3: Edge Cases and Validations (Optional)

#### No Availability Set by Parent

- For a new event (e.g., create a "Social Event" as Coach/Manager if needed), do not set availability for any player.
- As Coach/Manager, check the event.
- Verify players show a default or undefined status (e.g., "Pending" or blank).

#### Multiple Updates by Parent

- As Parent/Guardian, change "John Smith" availability for "League Game vs. Rivals" from "Available" to "Not Available."

### Expected Outcomes

- Parent/Guardian can mark availability for multiple players associated with their account.
- Coach/Manager can view all player availability statuses for events.
- Availability updates are immediately reflected and visible to both account types.
- Verify that only Parent/Guardian accounts can set availability, and Coach/Manager accounts have read-only access.

---

## Edit Event

### Objective

Verify that a Coach/Manager can edit existing events in TeamHub, including all event details (type, name, location, date, time, opponent, additional information), and that the edited event details are immediately visible to Parent/Guardian users on their dashboards.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A Coach/Manager account with a team created (e.g., team with code "TEAM123X") and at least one event created (e.g., "League Game vs. Rivals" with original details).
- A Parent/Guardian account with at least one player associated with the team (e.g., "John Smith" on "TEAM123X").
- Test environment with clubs, teams, and events manually created, and team codes assigned.
- Both accounts (Coach/Manager and Parent/Guardian) are registered and verified.

---

## Match Results

### Objective

Verify that a Coach/Manager can input and publish match results for completed events (matches or friendlies) in TeamHub, selecting team-wide or club-wide visibility, and that the results are immediately visible in the "Match Results" section of relevant dashboards for Parent/Guardian users.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A Coach/Manager account with a team created (e.g., team with code "TEAM123X") and at least two completed events:
  - "League Game vs. United FC" on 09/01/2025 (match).
  - "Friendly vs. City Strikers" on 09/02/2025 (friendly).
- A Parent/Guardian account with at least one player associated with the team (e.g., "John Smith" on "TEAM123X").
- Another Parent/Guardian account with a player in a different team but the same club (e.g., "TEAM789Y" in club "CLUB456Z").
- Test environment with clubs, teams, events, and players manually created, and codes assigned.
- Both accounts are registered and verified.

### Test Case 1: Coach/Manager Inputting and Publishing Match Result (Team-Wide)

#### Log In as Coach/Manager

- Open the TeamHub application in a web browser.
- Log in using Coach/Manager account credentials for "TEAM123X."
- Verify the dashboard loads with team management features.

#### Navigate to Completed Event

- Navigate to the team's event list or calendar for "TEAM123X."
- Locate the completed event "League Game vs. United FC" (dated 09/01/2025).
- Click an "Enter Result" or equivalent button for the event.
- Verify the result entry form appears with fields for the match result and publication options.

#### Enter Result and Select Team-Wide Publication

- Input the match result (e.g., Score: "TEAM123X 3 - 1 United FC").
- Select publication option: "Team" (for team-wide visibility).
- Optionally add additional details (e.g., "Player X scored twice").
- Click "Save" or "Publish Result."
- Verify a success message appears (e.g., "Result published successfully").
- Confirm the result is saved and associated with the event in the team's event list.

### Test Case 2: Coach/Manager Inputting and Publishing Match Result (Club-Wide)

#### Enter Result for Another Event

- Navigate to another completed event (e.g., "Friendly vs. City Strikers" on 09/02/2025).
- Click "Enter Result" or equivalent.
- Input the result (e.g., Score: "TEAM123X 2 - 2 City Strikers").
- Select publication option: "Club" (for club-wide visibility).
- Optionally add details (e.g., "Exciting draw with last-minute goal").
- Click "Save" or "Publish Result."
- Verify a success message and confirm the result is saved.

### Test Case 3: Parent/Guardian Viewing Team-Wide Result

#### Log In as Parent/Guardian (Associated with TEAM123X)

- Open the TeamHub application in a new browser session.
- Log in using Parent/Guardian account credentials with a player on "TEAM123X" (e.g., "John Smith").
- Verify the dashboard loads with parent-specific features (e.g., match results section).

#### Check Dashboard for Team-Wide Result

- Navigate to the dashboard or "Match Results" section for "TEAM123X."
- Verify the "League Game vs. United FC" result appears (e.g., "TEAM123X 3 - 1 United FC").
- Confirm additional details (if entered) are visible.
- Verify the "Friendly vs. City Strikers" result (club-wide) is also visible, as the user is part of the club.

#### Verify Non-Associated Team

- Log in with a Parent/Guardian account with a player in "TEAM789Y" (same club, different team).
- Verify the "Friendly vs. City Strikers" result (club-wide) appears in their "Match Results" section.
- Confirm the "League Game vs. United FC" result (team-wide) does not appear, as their player is not on "TEAM123X."

### Test Case 4: Edge Cases and Validations (Optional)

#### Missing Result Details

- As Coach/Manager, attempt to submit a result without a score.
- Verify form validation prevents submission (e.g., "Score is required").

#### Invalid Result Format

- Input an invalid score (e.g., "abc - def").
- Verify an error appears (e.g., "Invalid score format").

#### No Publication Option Selected

- Attempt to save a result without selecting "Team" or "Club."
- Verify an error or default behavior (e.g., "Please select publication option").

#### Non-Completed Event

- Attempt to enter a result for a future event (e.g., date 09/05/2025).
- Verify the system prevents result entry (e.g., "Results can only be entered for completed events").

#### Non-Club Member Access

- Log in with a Parent/Guardian account not associated with "CLUB456Z."
- Verify neither the team-wide nor club-wide results appear on their dashboard.

### Expected Outcomes

- Coach/Manager can input and publish match results for completed match or friendly events, selecting team-wide or club-wide visibility.
- Team-wide results appear only on dashboards of users with players in the team (e.g., "TEAM123X").
- Club-wide results appear on dashboards of all users in the club (e.g., "CLUB456Z").
- Results are immediately visible in the "Match Results" section of relevant dashboards.
- Validations prevent invalid result submissions.
- Non-relevant users (outside the team or club) cannot see the results.

### Notes

- Record deviations (e.g., UI issues, delayed updates) with screenshots and logs.
- Test across browsers (Chrome, Firefox, Safari) and devices (desktop, mobile) for compatibility.
- Ensure the team ("TEAM123X"), club ("CLUB456Z"), and completed events exist in the test environment.
- Update placeholders (e.g., URLs, team/club codes, event names) with actual app details.
- Verify that only Coach/Manager accounts can enter results, and Parent/Guardian accounts have read-only access.

---

## Manager Posts

### Objective

Verify that a Coach/Manager can create a free text post (up to 1000 characters) in TeamHub that appears in the "Recent Posts" section of the dashboard for users with players in the team. Confirm that Parent/Guardian users can mark the post as read, changing its status from unread to read.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A Coach/Manager account with a team created (e.g., team with code "TEAM123X").
- A Parent/Guardian account with at least one player associated with the team (e.g., "John Smith" on "TEAM123X").
- Test environment with clubs, teams, and players manually created, and team codes assigned.
- Both accounts (Coach/Manager and Parent/Guardian) are registered and verified.

### Test Case 1: Coach/Manager Creating a Post

#### Log In as Coach/Manager

- Open the TeamHub application in a web browser.
- Log in using Coach/Manager account credentials for "TEAM123X."
- Verify the dashboard loads with team management features (e.g., team options, post creation).

#### Navigate to Post Creation

- Navigate to the team's management section for "TEAM123X."
- Locate and click the "Create Post" or equivalent button (e.g., in a "Recent Posts" or "Announcements" section).
- Verify the post creation form appears with a text input field (supporting up to 1000 characters).

#### Create Post with Valid Text

- Input a message (e.g., "Reminder: Practice tomorrow at 4 PM. Bring water and wear team jerseys. Contact me with any questions!").
- Verify the character count is within the 1000-character limit (e.g., ~90 characters in this example).
- Click "Submit" or "Post."
- Verify a success message appears (e.g., "Post created successfully").
- Confirm the post appears in the team's "Recent Posts" section on the Coach/Manager dashboard.

#### Create Post at Character Limit

- Create another post with a 1000-character message (e.g., generate a lorem ipsum text or repeat a phrase to reach exactly 1000 characters).
- Click "Submit" or "Post."
- Verify the post is created successfully and appears in the "Recent Posts" section.

### Test Case 2: Parent/Guardian Viewing and Marking Post as Read

#### Log In as Parent/Guardian

- Open the TeamHub application in a new browser session.
- Log in using Parent/Guardian account credentials with a player on "TEAM123X" (e.g., "John Smith").
- Verify the dashboard loads with parent-specific features (e.g., "Recent Posts" section).

#### Verify Post Visibility

- Navigate to the dashboard or team section for "TEAM123X."
- Verify both posts (e.g., the reminder and 1000-character post) appear in the "Recent Posts" section.
- Confirm the posts are marked as "Unread" (e.g., highlighted, bolded, or with an unread indicator).

#### Mark Post as Read

- For the first post (e.g., "Reminder: Practice tomorrow..."), locate and click a "Mark as Read" or equivalent button/link.
- Verify the post's status changes to "Read" (e.g., highlight removed, status updated to "Read").
- Confirm the second post remains "Unread."

#### Mark Second Post as Read

- Click "Mark as Read" for the 1000-character post.
- Verify the status changes to "Read" and is updated visually on the dashboard.

### Test Case 3: Edge Cases and Validations (Optional)

#### Exceeding Character Limit

- As Coach/Manager, attempt to submit a post with 1001 characters.
- Verify an error appears (e.g., "Post exceeds 1000-character limit") and submission is prevented.

#### Empty Post

- Attempt to submit a post with no text.
- Verify an error appears (e.g., "Post content is required") or submission is blocked.

#### Non-Associated Parent/Guardian

- Log in with a Parent/Guardian account with a player not on "TEAM123X" (e.g., on "TEAM789Y").
- Verify the posts for "TEAM123X" do not appear in their "Recent Posts" section.

#### Multiple Players in Team

- Log in with a Parent/Guardian account with multiple players in "TEAM123X" (e.g., "John Smith" and "Emma Smith").
- Verify the posts appear once in the dashboard (not duplicated per player).
- Mark a post as read and confirm the status applies for the account, not per player.

#### Read Status Persistence

- Log out and log back in as the Parent/Guardian.
- Verify the marked "Read" posts retain their status, and unread posts remain unchanged.

### Expected Outcomes

- Coach/Manager can create posts up to 1000 characters, which appear in the "Recent Posts" section for team-associated users.
- Parent/Guardian users with players in the team see posts marked as "Unread" initially.
- Parent/Guardian can mark posts as "Read," updating the status visually and persistently.
- Posts are only visible to users with players in the team ("TEAM123X").
- Validations prevent invalid post submissions (e.g., exceeding character limit or empty posts).

### Notes

- Record deviations (e.g., UI issues, incorrect read status) with screenshots and logs.
- Test across browsers (Chrome, Firefox, Safari) and devices (desktop, mobile) for compatibility.
- Ensure the team ("TEAM123X") and associated players exist in the test environment.
- Update placeholders (e.g., URLs, team codes, post content) with actual app details.
- Verify that only Coach/Manager accounts can create posts, and only Parent/Guardian accounts with team-associated players can view/mark them.

---

## Player Awards

### Objective

Verify that a Coach/Manager can assign awards to a player in their team in TeamHub, selecting from predefined award types (Golden Goal, Most Improved Player, Manager's Player, Player's Player, Other with free text) and that the Parent/Guardian of the awarded player can view the award in the "Player Stats" section of their dashboard.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- A Coach/Manager account with a team created (e.g., team with code "TEAM123X").
- A Parent/Guardian account with at least one player associated with the team (e.g., "John Smith" on "TEAM123X").
- Test environment with clubs, teams, and players manually created, and team codes assigned.
- Both accounts (Coach/Manager and Parent/Guardian) are registered and verified.

### Test Case 1: Coach/Manager Assigning Awards

#### Log In as Coach/Manager

- Open the TeamHub application in a web browser.
- Log in using Coach/Manager account credentials for "TEAM123X."
- Verify the dashboard loads with team management features (e.g., player management or awards section).

#### Navigate to Award Assignment

- Navigate to the team's player management or awards section for "TEAM123X."
- Locate and click the "Assign Award" or equivalent button.
- Verify the award assignment form appears with a player selection dropdown, award type options, and a free text field for "Other."

#### Assign Predefined Award

- Select the player "John Smith" from the player dropdown.
- Choose the award type "Golden Goal" from the options (Golden Goal, Most Improved Player, Manager's Player, Player's Player, Other).
- Click "Submit" or "Assign Award."
- Verify a success message appears (e.g., "Award assigned to John Smith").
- Confirm the award is listed in the team's awards or player profile section.

#### Assign Custom "Other" Award

- Return to the award assignment form.
- Select "John Smith" again.
- Choose the "Other" award type.
- Enter a free text description (e.g., "Outstanding Team Spirit").
- Click "Submit" or "Assign Award."
- Verify a success message and confirm the custom award is listed.

### Test Case 2: Parent/Guardian Viewing Awards

#### Log In as Parent/Guardian

- Open the TeamHub application in a new browser session.
- Log in using Parent/Guardian account credentials with "John Smith" on "TEAM123X."
- Verify the dashboard loads with parent-specific features (e.g., "Player Stats" section).

#### Check Player Stats for Awards

- Navigate to the dashboard or "Player Stats" section for "John Smith."
- Verify both awards appear:
  - "Golden Goal" with associated details (e.g., date assigned or event context if applicable).
  - "Other: Outstanding Team Spirit" with the custom description.
- Confirm the awards are clearly displayed (e.g., in a list or table format).

#### Verify Read-Only Access

- Attempt to edit or delete the awards as the Parent/Guardian.
- Verify the Parent/Guardian cannot modify the awards (read-only access).

### Test Case 3: Edge Cases and Validations (Optional)

#### Missing Required Fields

- As Coach/Manager, attempt to submit an award without selecting a player or award type.
- Verify form validation prevents submission (e.g., "Player is required" or "Award type is required").

#### Empty "Other" Description

- Select "Other" award type without entering a free text description.
- Verify an error appears (e.g., "Description is required for Other award").

#### Non-Associated Parent/Guardian

- Log in with a Parent/Guardian account with a player not on "TEAM123X" (e.g., on "TEAM789Y").
- Verify the awards for "John Smith" do not appear in their "Player Stats" section.

#### Multiple Awards for Same Player

- As Coach/Manager, assign another award to "John Smith" (e.g., "Player's Player").
- Verify all awards ("Golden Goal," "Other: Outstanding Team Spirit," "Player's Player") are listed in the Parent/Guardian's "Player Stats" section.

#### Non-Team Player

- As Coach/Manager, attempt to assign an award to a player not on "TEAM123X."
- Verify the player does not appear in the selection dropdown or submission is blocked.

### Expected Outcomes

- Coach/Manager can assign predefined awards (Golden Goal, Most Improved Player, Manager's Player, Player's Player) and custom "Other" awards with free text.
- Awards are immediately visible in the "Player Stats" section of the Parent/Guardian dashboard for the associated player.
- Parent/Guardian users have read-only access to awards.
- Only players on the manager's team ("TEAM123X") can be assigned awards.
- Validations prevent invalid award submissions (e.g., missing player or empty "Other" description).

### Notes

- Record deviations (e.g., UI issues, incorrect award display) with screenshots and logs.
- Test across browsers (Chrome, Firefox, Safari) and devices (desktop, mobile) for compatibility.
- Ensure the team ("TEAM123X") and player ("John Smith") exist in the test environment.
- Update placeholders (e.g., URLs, team codes, player names) with actual app details.
- Verify that only Coach/Manager accounts can assign awards, and only Parent/Guardian accounts with associated players can view them.

---

## Kit Management

### Objective

Verify that a Team Manager can submit a request for new players or needed kit using a free text field in TeamHub, and that these requests are displayed on all Team Managers' dashboards with details of the user who submitted the request.

### Prerequisites

- Access to the TeamHub application (URL: [insert application URL]).
- Two Team Manager accounts (e.g., Manager A for team "TEAM123X" and Manager B for team "TEAM789Y" in the same club "CLUB456Z").
- Test environment with clubs, teams, and managers manually created, and team/club codes assigned.
- Both Manager accounts are registered, verified, and have the "Coach/Manager" role selected.
- A Parent/Guardian account (optional, to verify non-managers cannot access requests).

### Test Case 1: Team Manager Submitting a Request

#### Log In as Team Manager A

- Open the TeamHub application in a web browser.
- Log in using Manager A's credentials for "TEAM123X" (e.g., email: managerA@example.com).
- Verify the dashboard loads with team management features (e.g., team options, request submission).

#### Navigate to Request Submission

- Navigate to the team management or requests section for "TEAM123X."
- Locate and click the "Submit Request" or equivalent button (e.g., for new players or kit).
- Verify the request form appears with a free text field and an option to specify request type (e.g., New Players or Kit).

#### Submit New Players Request

- Select request type: "New Players."
- Enter a free text description (e.g., "Seeking two U14 strikers with experience for upcoming season. Contact me for trials.").
- Click "Submit" or "Send Request."
- Verify a success message appears (e.g., "Request submitted successfully").
- Confirm the request is listed in Manager A's dashboard or requests section.

#### Submit Kit Request

- Return to the request form.
- Select request type: "Kit."
- Enter a free text description (e.g., "Need 15 new jerseys, size M, for TEAM123X. Current stock is worn out.").
- Click "Submit" or "Send Request."
- Verify a success message and confirm the request is listed.

### Test Case 2: Viewing Requests on All Team Managers' Dashboards

#### Log In as Team Manager B

- Open the TeamHub application in a new browser session.
- Log in using Manager B's credentials for "TEAM789Y" (e.g., email: managerB@example.com).
- Verify the dashboard loads with team management features.

#### Check Dashboard for Requests

- Navigate to the dashboard or a dedicated "Requests" section.
- Verify both requests from Manager A appear:
  - New Players: "Seeking two U14 strikers with experience for upcoming season. Contact me for trials."
  - Kit: "Need 15 new jerseys, size M, for TEAM123X. Current stock is worn out."
- Confirm user details for Manager A are displayed with each request (e.g., Name: "Manager A," Email: "managerA@example.com," Team: "TEAM123X").
- Verify the requests are clearly distinguishable (e.g., labeled by type or team).

#### Log In as Team Manager A (Self-Check)

- Log back in as Manager A.
- Verify both requests appear on their dashboard with the same user details (self-referenced).

### Test Case 3: Edge Cases and Validations (Optional)

#### Empty Free Text Field

- As Manager A, attempt to submit a request without entering text in the free text field.
- Verify an error appears (e.g., "Request description is required") and submission is blocked.

#### Missing Request Type

- Attempt to submit a request without selecting "New Players" or "Kit."
- Verify an error appears (e.g., "Request type is required") or submission is prevented.

#### Long Free Text Input

- Enter a description exceeding any character limit (if applicable, e.g., 1000 characters).
- Verify an error or truncation occurs as per app design.

#### Non-Manager Access

- Log in with a Parent/Guardian account (e.g., with a player on "TEAM123X").
- Verify the requests do not appear on their dashboard or in any accessible section.

#### Multiple Managers Viewing

- Create a third Manager account for another team in "CLUB456Z" (e.g., "TEAM456Z").
- Log in and verify both requests from Manager A are visible with correct user details.

### Expected Outcomes

- Team Manager can submit requests for new players or kit using a free text field, specifying the request type.
- Submitted requests appear immediately on all Team Managers' dashboards in the club ("CLUB456Z").
- Each request includes user details (e.g., name, email, team) of the submitting manager (e.g., Manager A).
- Non-managers (e.g., Parent/Guardian) cannot view requests.
- Validations prevent invalid submissions (e.g., empty text or missing type).

### Notes

- Record deviations (e.g., UI issues, missing user details) with screenshots and logs.
- Test across browsers (Chrome, Firefox, Safari) and devices (desktop, mobile) for compatibility.
- Ensure the team ("TEAM123X"), club ("CLUB456Z"), and other teams exist in the test environment.
- Update placeholders (e.g., URLs, team/club codes, email addresses) with actual app details.
- Verify that only Team Manager accounts can submit and view requests, and user details are consistently displayed.