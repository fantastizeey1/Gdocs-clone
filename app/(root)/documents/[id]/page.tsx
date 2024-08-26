import CollaborativeRoom from "@/components/CollaborativeRoom";
import { getDocument } from "@/lib/actions/room.actions";
import { getClerkUsers } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Define the types
interface SearchParamProps {
  params: {
    id: string;
  };
}

interface User {
  email: string | null;
  // Other user properties as needed
}

const Document = async ({ params: { id } }: SearchParamProps) => {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      redirect('/sign-in');
      return null;
    }

    const room = await getDocument({
      roomId: id,
      userId: clerkUser.emailAddresses[0].emailAddress,
    });

    if (!room) {
      redirect('/');
      return null;
    }

    const userIds = Object.keys(room.usersAccesses);
    const users = await getClerkUsers({ userIds });

    // Ensure all users are valid before proceeding
    const usersData = users
      .filter((user: User | null): user is User => user !== null && user !== undefined)
      .map((user: User) => {
        const email = user.email;
        const userType = email && room.usersAccesses[email]
          ? room.usersAccesses[email].includes('room:write')
            ? 'editor'
            : 'viewer'
          : 'unregistered';

        return {
          ...user,
          userType,
        };
      });

    const filteredUsersData = usersData.filter((user: { userType: string; }) => user.userType !== 'unregistered');
    const unregisteredUsers = usersData.filter((user: { userType: string; }) => user.userType === 'unregistered');

    if (unregisteredUsers.length > 0) {
      console.warn('The following users are not registered on the platform:', unregisteredUsers);
      // Optionally add UI logic to display this warning
    }

    const currentUserType = room.usersAccesses[clerkUser.emailAddresses[0].emailAddress]?.includes('room:write')
      ? 'editor'
      : 'viewer';

    return (
      <main className="flex w-full flex-col items-center">
        <CollaborativeRoom
          roomId={id}
          roomMetadata={room.metadata}
          users={filteredUsersData}
          currentUserType={currentUserType}
        />
      </main>
    );
  } catch (error) {
    console.error("Error loading the document:", error);
    redirect('/');
    return null;
  }
};

export default Document;
