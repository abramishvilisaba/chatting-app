import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    typography: {
        // fontFamily: "Mooli, sans-serif",
        fontFamily: "Overpass, sans-serif",
    },
    palette: {
        primary: {
            main: "#0052cc",
        },
        secondary: {
            main: "#edf2ff",
        },
    },
});

export const lightTheme = createTheme({
    typography: {
        fontFamily: "Overpass, sans-serif",
    },
    palette: {
        mode: "light",
        primary: {
            main: "#0052cc",
        },
        secondary: {
            main: "#edf2ff",
        },
    },
});

export const darkTheme = createTheme({
    typography: {
        fontFamily: "Overpass, sans-serif",
    },
    palette: {
        mode: "dark",
        primary: {
            main: "#ffffff",
        },
        secondary: {
            main: "#1f1f1f",
        },
    },
});
