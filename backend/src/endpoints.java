// 1️⃣ Sign-up endpoint (POST /auth/signup)
@PostMapping("/auth/signup")
public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
    String hashedPassword = passwordEncoder.encode(req.getPassword());
    userRepository.save(new User(req.getEmail(), hashedPassword));
    return ResponseEntity.ok("User created");
}
// 2️⃣ Login endpoint (POST /auth/login)
@PostMapping("/auth/login")
public ResponseEntity<?> login(@RequestBody LoginRequest req) {
    User user = userRepository.findByEmail(req.getEmail());
    if (passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
        String jwt = jwtUtils.generateToken(user.getId());
        return ResponseEntity.ok(new JwtResponse(jwt));
    }
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
}
// 3️⃣ Protect habit endpoints
@GetMapping("/habits")
@PreAuthorize("hasRole('USER')")
public List<Habit> getHabits(@AuthenticationPrincipal User user) {
    return habitService.getHabitsForUser(user.getId());
}