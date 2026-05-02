// Centralized roles configuration with detailed information
const ROLES = {
    ADMIN: {
        name: "ADMIN",
        displayName: "Administrator",
        description: "Full system access with all permissions"
    },
    V_SQ_RECEPTIONIST: {
        name: "V_SQ_RECEPTIONIST",
        displayName: "Receptionist",
        description: "Front desk operations and patient registration"
    },
    CHIEF_DOCTOR: {
        name: "CHIEF_DOCTOR",
        displayName: "Chief Doctor",
        description: "Senior medical staff with administrative privileges"
    },
    LAB_ADMIN: {
        name: "LAB_ADMIN",
        displayName: "Lab Administrator",
        description: "Laboratory management and test administration"
    }
};

// Get all role values as an array (just the role names)
const getAllRoles = () => Object.keys(ROLES);

// Get all roles with detailed information
const getAllRolesDetailed = () => Object.values(ROLES);

// Check if a role is valid
const isValidRole = (role) => getAllRoles().includes(role);

module.exports = {
    ROLES,
    getAllRoles,
    getAllRolesDetailed,
    isValidRole
};
