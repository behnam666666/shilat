// src/components/AnimatedText.jsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

const AnimatedText = ({ text, isVisible, sx }) => {
  return (
    <Box
      component={motion.div}
      initial={false}
      animate={{
        maxWidth: isVisible ? "250px" : "0px",
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: "linear" }}
      sx={{
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <Typography sx={sx}>{text}</Typography>
    </Box>
  );
};

export default AnimatedText;
