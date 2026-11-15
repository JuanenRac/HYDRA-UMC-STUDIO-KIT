# Simulation bench

Runs the real HTTP client, the real session and the real connection history of the kit against a simulated HYDRA-UMC server (`tests/simulated-server.test.ts`): a `fetch` that signs people in, lets a token expire, rotates the refresh token, and fails on command. Nothing listens on a network and no real clock is used. The workflow `simulation.yml` runs it, and a second job measures the coverage of the kit with a floor that does not go down.

Scenarios:

- sign-in: a login, a call with the token, a refused login; an expired token is refreshed once and the refused call is repeated; a refused refresh signs the person out and is asked only once; a refresh that returns a token the server refuses too does not loop;
- a burst of 503 shorter than the retries is ridden out with doubling waits, a longer one ends with the number of attempts, a rate limit is waited for but never longer than the longest wait;
- a POST that is not marked as harmless is never repeated, one that is marked is repeated;
- a dropped connection ends as a network failure after the retries, a server that never answers ends as a timeout and works again when it answers, an answer cut in the middle is a parse failure and never a value, an error page is kept as text and not trusted as JSON, an empty answer is no value;
- a call cancelled by the caller stops and is not repeated;
- the connection history answers each failure of the server with its own kind of failure, limits the number of events it asks for, and reads the clients the server lists;
- a seeded storm of 120 calls with a fault drawn for each never throws out of `attempt`, never exceeds the attempts allowed and keeps the session consistent;
- ten parallel calls with an expired token and an application that shares the refresh under way cause one refresh, not ten (a refresh token that can be used once would otherwise sign the person out);
- a server that is off in the middle of a refresh leaves the sign-in for the next call, which refreshes and works;
- an outage longer than the retries ends with a temporary failure, leaves the sign-in untouched and works when the server is back;
- a restart of the server that forgets every token signs the person out and a new sign-in works.

The evidence of this project is `simulator`: it says nothing about a real browser, a real network or the real server.

Physical test still pending:

- a web client that uses the kit, opened in a real browser against a running HYDRA-UMC-SERVER: stop the server for ten seconds in the middle of a read and start it again, then let the access token expire; expected: the read ends well after the server is back, a command sent while it was off is not applied twice, and the expired sign-in is refreshed without asking for the password.
