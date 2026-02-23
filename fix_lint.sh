#!/bin/bash
sed -i 's/: any/: unknown/g' src/app/onboarding/page.tsx
sed -i 's/as any/as unknown/g' src/app/onboarding/page.tsx
sed -i 's/: any/: unknown/g' src/app/api/automation/\[id\]/test/route.ts
sed -i 's/as any/as unknown/g' src/app/api/automation/\[id\]/test/route.ts
sed -i 's/: any/: unknown/g' src/app/\(public\)/form/\[slug\]/page.tsx
sed -i 's/as any/as unknown/g' src/app/\(public\)/form/\[slug\]/page.tsx
sed -i 's/: any/: unknown/g' src/app/\(public\)/contact/\[slug\]/page.tsx
sed -i 's/as any/as unknown/g' src/app/\(public\)/contact/\[slug\]/page.tsx
sed -i 's/: any/: unknown/g' src/lib/google-calendar.ts
sed -i 's/as any/as unknown/g' src/lib/google-calendar.ts
sed -i 's/(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;/(window as unknown as { SpeechRecognition: unknown; webkitSpeechRecognition: unknown }).SpeechRecognition || (window as unknown as { SpeechRecognition: unknown; webkitSpeechRecognition: unknown }).webkitSpeechRecognition;/g' src/components/voice-assistant.tsx

npm run lint:fix
