"use client";

import React from "react";
import StudyMaterialRepository from "./StudyMaterialRepository";

interface ChemistryLibraryVaultProps {
  studyMaterials?: any[];
  student?: any;
}

export default function ChemistryLibraryVault({ studyMaterials = [], student }: ChemistryLibraryVaultProps) {
  return (
    <section id="materials" className="w-full scroll-mt-20">
      <StudyMaterialRepository 
        studyMaterials={studyMaterials} 
        student={student} 
        basePath="/dashboard" 
      />
    </section>
  );
}
