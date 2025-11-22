#include "crow_all.h"
#include "json.hpp"
#include <vector>
#include <string>
#include <map>

using json = nlohmann::json;

// Struct to hold individual event stock purchase
struct EventPurchase {
    bool buyYes;
    int amount;
    int quantity;
};

// User struct: stores username, password, and purchases per event
struct User {
    std::string username;
    std::string password;
    std::map<int, std::vector<EventPurchase>> eventHistory; // event id => purchases
};

std::map<std::string, User> users;

// Market class: one for each event
class Market {
public:
    int id;
    std::string title;
    bool resolved;
    bool outcomeYes;
    std::map<std::string, int> yesShares, noShares; // shares per user

    Market(int id, const std::string& title)
        : id(id), title(title), resolved(false), outcomeYes(false) {}

    json toJson() const {
        return {
            {"id", id},
            {"title", title},
            {"resolved", resolved},
            {"outcome", resolved ? (outcomeYes ? "YES" : "NO") : "Unresolved"}
        };
    }
};

std::vector<Market> markets = {
    Market(1, "Will the fest happen this year?"),
    Market(2, "Will the cricket team win the final?")
};

Market* findMarket(int id) {
    for (auto& m : markets)
        if (m.id == id) return &m;
    return nullptr;
}

int main() {
    crow::SimpleApp app;

    // Register user
    CROW_ROUTE(app, "/api/register").methods("POST"_method)
    ([](const crow::request& req) {
        auto body = json::parse(req.body);
        std::string username = body["username"];
        std::string password = body["password"];
        if (users.count(username) == 0) {
            users[username] = User{username, password};
            return crow::response(200, "Registered");
        }
        return crow::response(409, "Username exists");
    });

    // Login user
    CROW_ROUTE(app, "/api/login").methods("POST"_method)
    ([](const crow::request& req) {
        auto body = json::parse(req.body);
        std::string username = body["username"];
        std::string password = body["password"];
        if (users.count(username) && users[username].password == password) {
            return crow::response(200, "Login ok");
        }
        return crow::response(401, "Invalid credentials");
    });

    // Fetch events
    CROW_ROUTE(app, "/api/markets")
    ([] {
        json resp = json::array();
        for (auto& m : markets) resp.push_back(m.toJson());
        return crow::response(resp.dump());
    });

    // Purchase event (YES/NO), specifying amount and quantity
    CROW_ROUTE(app, "/api/trade").methods("POST"_method)
    ([](const crow::request& req) {
        auto body = json::parse(req.body);
        int id = body["id"];
        bool yes = body["buyYes"];
        std::string user = body["user"];
        int amount = body["amount"];
        int quantity = body["quantity"];
        Market* m = findMarket(id);
        if (m && !m->resolved && users.count(user)) {
            // Update user shares for each event
            if (yes)
                m->yesShares[user] += quantity;
            else
                m->noShares[user] += quantity;
            users[user].eventHistory[id].push_back(EventPurchase{yes, amount, quantity});
            return crow::response(200);
        }
        return crow::response(400);
    });

    // Resolve event outcome
    CROW_ROUTE(app, "/api/resolve").methods("POST"_method)
    ([](const crow::request& req) {
        auto body = json::parse(req.body);
        int id = body["id"];
        bool outcome = body["outcomeYes"];
        Market* m = findMarket(id);
        if (m && !m->resolved) {
            m->resolved = true;
            m->outcomeYes = outcome;
            return crow::response(200);
        }
        return crow::response(400);
    });

    // Per-user event purchase history, including amount/quantity
    CROW_ROUTE(app, "/api/history").methods("POST"_method)
    ([](const crow::request& req) {
        auto body = json::parse(req.body);
        std::string username = body["username"];
        if (users.count(username)) {
            json hist;
            for (auto& [eventId, purchases] : users[username].eventHistory) {
                hist[std::to_string(eventId)] = json::array();
                for (auto& e : purchases) {
                    hist[std::to_string(eventId)].push_back({
                        {"buyYes", e.buyYes},
                        {"amount", e.amount},
                        {"quantity", e.quantity}
                    });
                }
            }
            return crow::response(hist.dump());
        }
        return crow::response(404, "No such user");
    });

    app.port(3001).multithreaded().run();
}
