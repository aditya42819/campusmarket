import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const yesColor = "#10b981";
const noColor = "#2563eb";
const buyYesColor = "#10b981";
const buyNoColor = "#ef4444";
const mainBg = "#f8fbff";
const cardBg = "#ffffffdd";
const accentBlue = "#2563eb";

function getMarketLineData(marketId, bets) {
  const data = [];
  let yes = 0, no = 0;
  for (const [i, bet] of bets.filter(b => b.id === marketId).entries()) {
    if (bet.buyYes) yes++;
    else no++;
    data.push({ name: `Bet ${i + 1}`, yes, no });
  }
  if (data.length === 0) data.push({ name: "Start", yes: 0, no: 0 });
  return data;
}

function App() {
  const [user, setUser] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const [markets, setMarkets] = useState([]);
  const [bets, setBets] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [tab, setTab] = useState('ongoing');

  useEffect(() => {
    fetch('/api/markets')
      .then(res => res.json())
      .then(setMarkets)
      .catch(() => setStatusMsg('Could not load markets.'));
  }, []);

  function loadHistory(username, freshMarkets) {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        let betArr = [];
        for (const marketId in data) {
          betArr = betArr.concat(
            data[marketId].map((yesNo, idx) => ({
              id: Number(marketId),
              buyYes: yesNo === "YES",
              marketTitle: (freshMarkets || markets).find(m => m.id === Number(marketId))?.title || "",
              timestamp: `Bet ${idx + 1}`
            }))
          );
        }
        setBets(betArr);
      });
  }

  const handleAuth = async () => {
    if (!loginInput || !password) return setStatusMsg("Enter username and password!");
    const url = isRegister ? "/api/register" : "/api/login";
    const body = JSON.stringify({ username: loginInput.trim(), password });
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    if (res.ok) {
      setUser(loginInput.trim());
      setLoginInput('');
      setPassword('');
      setStatusMsg(isRegister ? "Registered! Now log in." : "Login successful!");
      setIsRegister(false);
      fetch('/api/markets')
        .then(res => res.json())
        .then(freshMarkets => {
          setMarkets(freshMarkets);
          loadHistory(loginInput.trim(), freshMarkets);
        });
    } else {
      setStatusMsg(await res.text());
    }
  };

  const handleLogout = () => {
    setUser('');
    setBets([]);
    setStatusMsg('');
  };

  const handleBuy = async (marketId, buyYes, marketTitle) => {
    if (!user) return setStatusMsg("Log in first!");
    await fetch('/api/trade', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: marketId, user, buyYes })
    });
    setStatusMsg(`You bought ${buyYes ? 'YES' : 'NO'} for "${marketTitle}".`);
    loadHistory(user);
  };

  // ---- Admin Tools ----
  const isAdmin = user === "admin";

  async function resolveMarket(marketId, val) {
    await fetch('/api/resolve', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: marketId, outcomeYes: val })
    });
    setStatusMsg(`Resolved event as ${val ? "YES" : "NO"}`);
    fetch('/api/markets').then(res => res.json()).then(setMarkets);
  }

  return (
    <div style={{
      fontFamily: "Inter, Segoe UI, sans-serif",
      background: mainBg,
      minHeight: "100vh",
      margin: 0,
      paddingBottom: 65
    }}>
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fff",
        color: accentBlue,
        padding: "22px 33px",
        borderBottom: "1.5px solid #e5ecfd",
        boxShadow: "0 1px 7px #2563eb09"
      }}>
        <h1 style={{
          margin: 0,
          fontWeight: 900,
          fontSize: "2.07em",
          color: accentBlue,
          letterSpacing: ".03em"
        }}>
          Campus Prediction Market
        </h1>
        {user && (
          <span style={{ fontSize: "1.08em" }}>
            <b style={{ color: accentBlue }}>{user}</b> &nbsp;|&nbsp;
            <button style={{ color: buyNoColor, background: "transparent", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "1em" }} onClick={handleLogout}>
              Log out
            </button>
          </span>
        )}
      </header>

      {!user && (
        <div style={{
          maxWidth: 400,
          margin: "70px auto",
          padding: 40,
          textAlign: "center",
          background: cardBg,
          borderRadius: 22,
          boxShadow: "0 6px 32px #2dd4bf0e",
          border: "1.5px solid #e0e7ff"
        }}>
          <h2 style={{
            fontWeight: 900,
            fontSize: "2.1em",
            color: accentBlue,
            marginBottom: 10,
            letterSpacing: ".01em"
          }}>
            Welcome to <span style={{ color: buyYesColor }}>Campus Market</span>
          </h2>
          <div style={{
            display: "inline-block",
            background: "#e0e7ff",
            color: accentBlue,
            fontWeight: 700,
            letterSpacing: ".07em",
            fontSize: "1.02em",
            borderRadius: 8,
            padding: "7px 18px",
            margin: "5px 0 27px 0",
          }}>
            Predict • Compete • Win
          </div>
          <div style={{ marginTop: 24, marginBottom: 11 }}>
            <input style={{
              fontSize: "1.01em", borderRadius: 10,
              border: "1.3px solid #c7d2fe",
              marginBottom: 17, padding: "13px 20px",
              width: 210, background: "#f8fafc"
            }}
              value={loginInput}
              placeholder="Username"
              onChange={e => setLoginInput(e.target.value)}
            /><br />
            <input style={{
              fontSize: "1.01em", borderRadius: 10,
              border: "1.3px solid #c7d2fe",
              marginBottom: 17, padding: "13px 20px",
              width: 210, background: "#f8fafc"
            }}
              value={password}
              type="password"
              placeholder="Password"
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 13, marginTop: 8 }}>
            <button style={{
              background: buyYesColor,
              color: "#fff",
              border: "none",
              padding: "11px 32px",
              borderRadius: 16,
              fontWeight: 800,
              fontSize: "1.04em",
              boxShadow: "0 1px 10px #10b9811a",
              transition: "0.1s",
              cursor: "pointer"
            }} onClick={handleAuth}>
              {isRegister ? "Register" : "Login"}
            </button>
            <button style={{
              background: "#fff",
              color: accentBlue,
              border: '1.5px solid #b6d9ff',
              borderRadius: 16,
              padding: "11px 19px",
              fontWeight: 700,
              fontSize: "1.04em",
              cursor: "pointer"
            }}
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Switch to Login" : "Switch to Register"}
            </button>
          </div>
          {statusMsg && <p style={{
            color: buyNoColor,
            background: "#ffe4e6",
            fontWeight: "bold",
            marginTop: "22px",
            borderRadius: 12,
            padding: 11,
            fontSize: "1.08em"
          }}>{statusMsg}</p>}
        </div>
      )}

      {/* --- ADMIN PANEL --- */}
      {user && isAdmin && (
        <div style={{
          maxWidth: 900, margin: "45px auto 23px auto",
          background: "#fffdf3", border: "2.5px solid #ffe066", borderRadius: 19,
          padding: 30, boxShadow: "0 2px 16px #fde68a33"
        }}>
          <h2 style={{ color: "#d97706", fontWeight: 900, marginBottom: 17 }}>Admin Panel</h2>
          <h4 style={{ margin: "13px 0 10px 0" }}>Resolve/End Ongoing Events</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {markets.filter(m => !m.resolved).map(m =>
              <li key={m.id} style={{ marginBottom: 13, background: "#fffbe7", padding: 17, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <b>{m.title}</b>
                </div>
                <div>
                  <button onClick={() => resolveMarket(m.id, true)} style={{ background: "#10b981", color: "#fff", fontWeight: 700, border: "none", borderRadius: 8, padding: "8px 20px", marginRight: 6, cursor: "pointer" }}>
                    End as YES
                  </button>
                  <button onClick={() => resolveMarket(m.id, false)} style={{ background: "#ef4444", color: "#fff", fontWeight: 700, border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>
                    End as NO
                  </button>
                </div>
              </li>
            )}
            {markets.filter(m => !m.resolved).length === 0 &&
              <li style={{ color: "#d97706", fontWeight: 700, marginLeft: 3 }}>No unresolved events.</li>
            }
          </ul>
        </div>
      )}

      {/* LOGGED IN: DASHBOARD */}
      {user && (
        <div style={{ maxWidth: 1100, margin: "28px auto" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
            <button style={{
              padding: "13px 38px", fontWeight: 700, borderRadius: 22, border: "none", cursor: "pointer",
              background: tab === "ongoing" ? buyYesColor : "#f7fafd", color: tab === "ongoing" ? "#fff" : "#0f766e", fontSize: "1.1em"
            }} onClick={() => setTab("ongoing")}>
              Ongoing Bets
            </button>
            <button style={{
              padding: "13px 38px", fontWeight: 700, borderRadius: 22, border: "none", cursor: "pointer",
              background: tab === "settled" ? buyNoColor : "#f7fafd", color: tab === "settled" ? "#fff" : "#b91c1c", fontSize: "1.1em"
            }} onClick={() => setTab("settled")}>
              Settled Bets
            </button>
          </div>
          {/* Markets */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", justifyContent: "center", minHeight: 320 }}>
            {markets.filter(m => (tab === "ongoing" ? !m.resolved : m.resolved)).map((m) => {
              const lineData = getMarketLineData(m.id, bets);
              return (
                <div key={m.id} style={{
                  flex: "0 1 400px", background: cardBg, borderRadius: 15,
                  boxShadow: "0 7px 26px #1e293b13", marginBottom: 32, padding: 27, border: "1.6px solid #e5ecfd"
                }}>
                  <h2 style={{
                    fontWeight: 700, fontSize: "1.14em", marginBottom: 18, color: accentBlue
                  }}>{m.title}</h2>
                  {/* Chart */}
                  <div style={{ margin: "17px 0 9px 0", background: "#fff", borderRadius: 11, padding: "10px" }}>
                    <div style={{ textAlign: "right", fontSize: "1em", marginBottom: 0 }}>
                      <span style={{ color: buyYesColor, fontWeight: 700 }}>Green = Yes</span>
                      <br />
                      <span style={{ color: noColor, fontWeight: 700 }}>Blue = No</span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={lineData} margin={{ top: 17, right: 24, left: 6, bottom: 15 }}>
                        <CartesianGrid stroke="#e0e7ff" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="yes" stroke={yesColor} strokeWidth={3} name="YES" dot={false} />
                        <Line type="monotone" dataKey="no" stroke={noColor} strokeWidth={3} name="NO" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {!m.resolved && (
                    <div style={{ margin: "13px 0 2px 0", display: "flex", gap: "15px", justifyContent: "center" }}>
                      <button
                        style={{
                          background: buyYesColor, color: "#fff", fontWeight: 700, border: 'none', borderRadius: 11, padding: "9px 25px", cursor: "pointer", fontSize: "1em"
                        }}
                        onClick={() => handleBuy(m.id, true, m.title)}
                      >Buy YES</button>
                      <button
                        style={{
                          background: buyNoColor, color: "#fff", fontWeight: 700, border: 'none', borderRadius: 11, padding: "9px 25px", cursor: "pointer", fontSize: "1em"
                        }}
                        onClick={() => handleBuy(m.id, false, m.title)}
                      >Buy NO</button>
                    </div>
                  )}
                  {m.resolved && (
                    <div style={{
                      textAlign: "center", marginTop: 12, fontWeight: 700, color: m.outcome === "YES" ? buyYesColor : buyNoColor, fontSize: "1.11em"
                    }}>
                      Resolved outcome: {m.outcome}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Your Bet History */}
          <div style={{
            maxWidth: 800, margin: "34px auto 0 auto", background: "#f7fafd", borderRadius: 12, padding: 29,
            boxShadow: "0 3px 17px #bae6fd22", border: "1.5px solid #e0e7ff"
          }}>
            <h2 style={{ color: accentBlue, fontWeight: 700, marginBottom: 20 }}>Your Bet History</h2>
            {bets.length ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {bets.map((b, i) =>
                  <li key={b.id + '' + i} style={{
                    margin: "12px 0", padding: "12px 15px", background: "#fff", borderRadius: 8,
                    boxShadow: "0 2px 8px #e0e7ff44", display: "flex", justifyContent: "space-between", alignItems: "center",
                    border: "1.2px solid #e0e7ff"
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "1em" }}>{b.marketTitle}</span>
                      <span style={{
                        background: b.buyYes ? buyYesColor : buyNoColor, color: "#fff",
                        borderRadius: 7, fontWeight: 700, marginLeft: 12, padding: "5px 11px", fontSize: "0.95em"
                      }}>
                        {b.buyYes ? "YES" : "NO"}
                      </span>
                    </div>
                    <span style={{ color: "#7dd3fc", fontSize: "89%", letterSpacing: ".03em" }}>{b.timestamp}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p style={{ color: "#a1a1aa", fontWeight: 700 }}>No bets placed yet.</p>
            )}
          </div>
          {statusMsg && <p style={{ color: buyNoColor, background: "#ffe4e6", fontWeight: "bold", marginTop: "18px", borderRadius: 10, padding: 7 }}>{statusMsg}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
