\---  
name: Verify I/J formulas after writes  
description: >-  
Use when checking that I and J on the PDI Automations eFleets All Cars sorted  
tab are still formulas after a Last Reading or oil-date write, not hardcoded  
numbers.  
\---  
\# Verify I/J formulas after writes  

Read-only. Do not type into the sheet except Find. Never use the name box. Never write I, J, K, or the original PDI / Oil Change Summary tabs.  

\#\# Where  

\- File: Automations Copy \`1e0AhA0LTLru0\_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ\`  
\- Tab: \`eFleets All Cars sorted\` (gid \`733911326\`)  
\- URL: \`https://docs.google.com/spreadsheets/d/1e0AhA0LTLru0\_o-WZsO81eL7-ekfbxV-VTDvaitGHHQ/edit\#gid=733911326\`  
\- Match vehicles by column \*\*M\*\* (eFleets ID), not nickname.  

\#\# Inputs  

\- One or more sheet rows, or eFleets IDs to resolve to rows via column M.  

Typical spot-check rows after a clean trial batch:  

\- Row 172 / M=\`26K8LT\` (VA2)  
\- Row 42 / M=\`27SGX5\` (MD3)  
\- Row 100 / M=\`292NFZ\` (NJ15)  
\- Row 171 / M=\`27SGXV\` (VA1) if checking the control car  

\#\# Steps  

1\. Open the URL above. Confirm the tab name is \`eFleets All Cars sorted\`.  
2\. If Chrome shows \*\*Aw, Snap\!\*\*, click Reload and wait for the grid. Do not edit.  
3\. Find the row by column M. Do not grab a similar ID (\`27SGX4\` is not \`27SGX5\`; \`292ND8\` is not \`292NFZ\`).  
4\. Click \*\*I\*\* on that row. Read the \*\*formula bar\*\*, not just the displayed number.  
5\. Click \*\*J\*\* on that row. Read the formula bar.  
6\. Pass the row only if both are formulas of this shape (row number varies):  

\`\`\`  
I: =IF(OR(J{row}=\"\",G{row}=\"\"),\"\",J{row}-G{row})  
J: =IF(E{row}=\"\",\"\",E{row}+5000)  
\`\`\`  

7\. Fail the row if I or J is a hardcoded number, blank, or any other formula.  
8\. Displayed I/J values moving after a G write is expected. That is not proof they are still formulas — the formula bar is the proof.  
9\. Do not write. Do not Ctrl+Z unless you just typed by accident, and then stop.  

\#\# Pass / fail tokens  

\- \`IJ\_FORMULA\_PASS\` — both bars match the shapes above  
\- \`IJ\_HARDCODED\` — I or J is a number in the formula bar  
\- \`WRONG\_ROW\` — M does not match the requested eFleets ID  
\- \`AW\_SNAP\` — tab crashed; reload and retry before failing the sheet
