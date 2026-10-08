class AuthManager {
    constructor() {
        localStorage.removeItem("db-users");
        localStorage.removeItem("users");
        this.currentUser = this.loadUser();
    }

    loadUser() {
        if (!database.getSession()?.access_token) {
            localStorage.removeItem("currentUser");
            return null;
        }
        try {
            return JSON.parse(localStorage.getItem("currentUser") || "null");
        } catch {
            localStorage.removeItem("currentUser");
            return null;
        }
    }

    async getAllUsers() {
        const users = await database.fetchAPI("get_users");
        return users.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            role: user.role || "user",
            createdAt: user.created_at
        }));
    }

    saveUsers(users) {
        database.write("users", users);
    }

    isLoggedIn() {
        return this.currentUser !== null && Boolean(database.getSession()?.access_token);
    }

    async register(email, password, firstName, lastName) {
        try {
            const result = await database.signUp(email.trim().toLowerCase(), password, firstName, lastName);
            if (!result.session) {
                localStorage.removeItem("bytecart-supabase-session");
                return {
                    success: true,
                    requiresEmailConfirmation: true,
                    message: "Check your email and confirm your account before logging in."
                };
            }

            const profile = await database.fetchAPI("get_user", { query: { email: result.user.email } });
            this.currentUser = {
                id: result.user.id,
                email: result.user.email,
                firstName: profile?.first_name || firstName,
                lastName: profile?.last_name || lastName,
                role: profile?.role || "user"
            };
            localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login(email, password) {
        try {
            const result = await database.signIn(email.trim().toLowerCase(), password);
            const profile = await database.fetchAPI("get_user", { query: { email: result.user.email } });
            this.currentUser = {
                id: result.user.id,
                email: result.user.email,
                firstName: profile?.first_name || result.user.user_metadata?.first_name || "",
                lastName: profile?.last_name || result.user.user_metadata?.last_name || "",
                role: profile?.role || "user"
            };
            localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
            let warning;
            try {
                await database.fetchAPI("record_login_event");
            } catch (error) {
                console.warn("Login succeeded, but the sign-in event could not be recorded:", error.message);
                warning = "Login succeeded, but this sign-in could not be recorded in the activity log. Contact an administrator if this continues.";
            }
            return { success: true, user: this.currentUser, warning };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await database.signOut();
        } finally {
            this.currentUser = null;
            localStorage.removeItem("currentUser");
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.isLoggedIn() && this.currentUser.role === "admin";
    }
}

const authManager = new AuthManager();
