## 🚀 Quick Start for Partner Developer

This section is for the trusted partner developer to quickly set up and run the app, make UI changes, and see them in action.

### Setup and Run
1. **Unzip the folder** and navigate to the project directory.

2. **Sign in to Expo**:
   ```bash
   expo login -u Yeabsiragenet48@gmail.com -p MOM12726920
   ```

3. **Start the development server**:
   ```bash
   npm run start
   ```
   This will start the Expo development server.

4. **Run on device/simulator**:
   - **For quick UI testing with hot reload**: Install Expo Go on your device, scan the QR code shown in the terminal.
   - **For full developer build**:
     - Android: `npm run android`
     - iOS: `npm run ios`

### Making UI Changes
- Edit the code in the `app/` directory (for screens) or `components/` directory (for reusable components).
- For UI changes, use Expo Go for instant hot reload.
- If using developer build, rebuild the app after changes: `npm run android` or `npm run ios`.
- Changes will be visible immediately in the app on your device/simulator.

### Notes
- The app uses TypeScript and Biome for linting/formatting.
- Run `npm run check` to check for issues.
- For production builds, use `npm run android-release`.
