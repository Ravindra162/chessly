import {Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, DropdownItem, DropdownTrigger, Dropdown, DropdownMenu, Avatar} from "@nextui-org/react";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import Logo from "../pages/landing/components/Logo";

export default function App() {
    const user = useContext(UserContext);

    return (
        <Navbar className="bg-black/60 border-b border-[#16A34A]/20">
            <NavbarBrand>
                <Logo/>
            </NavbarBrand>

            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                <NavbarItem>
                    <Link className="text-gray-300 hover:text-white transition-colors" href="/">
                        Play
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link className="text-gray-300 hover:text-white transition-colors" href="/">
                        Learn
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link className="text-gray-300 hover:text-white transition-colors" href="/">
                        Stats
                    </Link>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify="end">
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <Avatar
                            as="button"
                            className="transition-transform"
                            size="xl"
                            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNEdQxpFd660cuuZ1MAEuwoIJx0YRsNfxyPw&s"
                            name={user?.user?.username || "User"}
                        />
                    </DropdownTrigger>
                    <DropdownMenu 
                        aria-label="Profile Actions" 
                        variant="flat"
                        className="bg-black rounded-xl border-2 border-black text-white"
                    >
                        <DropdownItem key="profile-1" className="h-14 gap-2">
                            <p className="font-semibold">Signed in as</p>
                            <p className="font-semibold text-[#16A34A]">{user?.user?.username}</p>
                        </DropdownItem>
                        <DropdownItem key="profile" className="text-white hover:text-[#16A34A]">Profile</DropdownItem>
                        <DropdownItem key="settings" className="text-white hover:text-[#16A34A]">Settings</DropdownItem>
                        <DropdownItem key="history" className="text-white hover:text-[#16A34A]">Match History</DropdownItem>
                        <DropdownItem 
                            key="logout" 
                            className="text-red-500 hover:text-red-400"
                            onClick={() => {
                                localStorage.removeItem("auth_token");
                                window.location.href = "/login";
                            }}
                        >
                            Log Out
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </NavbarContent>
        </Navbar>
    );
}