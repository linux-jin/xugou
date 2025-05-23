import { Link, useNavigate, useLocation } from "react-router-dom";
import { Box, Flex, Text, Container } from "@radix-ui/themes";
import {
  Separator,
  Button,
  Avatar,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui";
import {
  ExitIcon,
  PersonIcon,
  PersonIcon as UserIcon,
  DashboardIcon,
  ChevronDownIcon,
  ActivityLogIcon,
  CubeIcon,
  PieChartIcon,
  BellIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../providers/AuthProvider";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <Box className={`navbar-wrapper ${isScrolled ? "scrolled" : ""}`}>
      <Box >
        <Container size="4">
          <Flex
            justify="between"
            align="center"
            py="2"
      
          >
            {/* Logo 部分 */}
            <Link to="/" >
              <Flex align="center" gap="2">
                <Box >
                  <PieChartIcon width="20" height="20" />
                </Box>
                <Text size="4" weight="bold">
                  XUGOU
                </Text>
              </Flex>
            </Link>

            {/* 导航链接 */}
            <Flex align="center" gap="2">
              {isAuthenticated ? (
                <>
                  <Flex  align="center">
                    <Link
                      to="/dashboard"
                      className={`nav-link ${
                        isActive("/dashboard") ? "active" : ""
                      }`}
                    >
                      <Button variant="ghost">
                        <DashboardIcon width="14" height="14" />
                        <Text ml="1" size="2">
                          {t("navbar.dashboard")}
                        </Text>
                      </Button>
                    </Link>

                    <Link
                      to="/monitors"
                      className={`nav-link ${
                        isActive("/monitors") ? "active" : ""
                      }`}
                    >
                      <Button variant="ghost">
                        <ActivityLogIcon width="14" height="14" />
                        <Text ml="1" size="2">
                          {t("navbar.apiMonitors")}
                        </Text>
                      </Button>
                    </Link>

                    <Link
                      to="/agents"
                      className={`nav-link ${
                        isActive("/agents") ? "active" : ""
                      }`}
                    >
                      <Button variant="ghost">
                        <CubeIcon width="14" height="14" />
                        <Text ml="1" size="2">
                          {t("navbar.agentMonitors")}
                        </Text>
                      </Button>
                    </Link>

                    <Link
                      to="/status/config"
                      className={`nav-link ${
                        isActive("/status/config") ? "active" : ""
                      }`}
                    >
                      <Button variant="ghost">
                        <PieChartIcon width="14" height="14" />
                        <Text ml="1" size="2">
                          {t("navbar.statusPage")}
                        </Text>
                      </Button>
                    </Link>

                    <Link
                      to="/notifications"
                      className={`nav-link ${
                        isActive("/notifications") ? "active" : ""
                      }`}
                    >
                      <Button variant="ghost">
                        <BellIcon width="14" height="14" />
                        <Text ml="1" size="2">
                          {t("navbar.notifications")}
                        </Text>
                      </Button>
                    </Link>
                  </Flex>

                  <Separator orientation="vertical" />

                  {/* 语言选择器 */}
                  <LanguageSelector />

                  <Separator orientation="vertical" />

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Flex
                        align="center"
                        gap="1"
                        className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <Avatar>
                          <AvatarImage
                            alt={user?.username}
                            width="32"
                            height="32"
                          />
                        </Avatar>
                        <Box display={{ initial: "none", sm: "block" }}>
                          <Text size="2">{user?.username}</Text>
                        </Box>
                        <ChevronDownIcon width="12" height="12" />
                      </Flex>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="user-dropdown">
                      <DropdownMenuLabel>
                        <Text size="1" color="gray">
                          {t("navbar.loggedInAs")}
                        </Text>
                        <Text size="2" weight="bold">
                          {user?.username}
                        </Text>
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator />

                      {user?.role === "admin" && (
                        <DropdownMenuItem onClick={() => navigate("/users")}>
                          <Flex gap="2" align="center">
                            <UserIcon width="14" height="14" />
                            <Text size="2">{t("navbar.userManagement")}</Text>
                          </Flex>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <Flex gap="2" align="center">
                          <PersonIcon width="14" height="14" />
                          <Text size="2">{t("navbar.profile")}</Text>
                        </Flex>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem color="red" onClick={handleLogout}>
                        <Flex gap="2" align="center">
                          <ExitIcon width="14" height="14" />
                          <Text size="2">{t("navbar.logout")}</Text>
                        </Flex>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Flex gap="2" align="center">
                  {/* 语言选择器 */}
                  <LanguageSelector />

                  <Separator orientation="vertical" />

                  <Button variant="ghost" onClick={() => navigate("/login")}>
                    {t("navbar.login")}
                  </Button>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Navbar;
