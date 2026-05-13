"""SQLite database for order management — matches Excel sheet structure."""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "orders.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS cell_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            column_name TEXT NOT NULL,
            old_value TEXT DEFAULT '',
            new_value TEXT DEFAULT '',
            changed_by TEXT DEFAULT 'Admin',
            changed_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );
        CREATE INDEX IF NOT EXISTS idx_changes_order ON cell_changes(order_id, column_name);

        CREATE TABLE IF NOT EXISTS index_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            platform TEXT DEFAULT '',
            direction TEXT DEFAULT '',
            role TEXT DEFAULT '',
            rating INTEGER DEFAULT 3,
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS orders (
            id                      INTEGER PRIMARY KEY AUTOINCREMENT,
            year                    INTEGER NOT NULL DEFAULT 2026,
            month                   TEXT NOT NULL DEFAULT '',
            seq_num                 TEXT DEFAULT '',
            intent_date             TEXT DEFAULT '',
            continue_status         TEXT DEFAULT '',
            order_result            TEXT DEFAULT '',
            refunded_continued      TEXT DEFAULT '',
            deposit_amount          TEXT DEFAULT '',
            balance_amount          TEXT DEFAULT '',
            contact                 TEXT DEFAULT '',
            promise_timeframe       TEXT DEFAULT '',
            pub_type                TEXT DEFAULT '',
            internal_order_id       TEXT DEFAULT '',
            initial_title           TEXT DEFAULT '',
            submission_progress     TEXT DEFAULT '',
            status_chart            TEXT DEFAULT '',
            journal_info            TEXT DEFAULT '',
            publisher_type          TEXT DEFAULT '',
            author_email_reg        TEXT DEFAULT '',
            sys_account             TEXT DEFAULT '',
            divider                 TEXT DEFAULT '',
            author_table_confirmed  TEXT DEFAULT '',
            email_account           TEXT DEFAULT '',
            all_authors             TEXT DEFAULT '',
            fund_info               TEXT DEFAULT '',
            client_instructions     TEXT DEFAULT '',
            response_plan           TEXT DEFAULT '',
            dispatch_1              TEXT DEFAULT '',
            dispatch_2              TEXT DEFAULT '',
            dispatch_3              TEXT DEFAULT '',
            dispatch_4              TEXT DEFAULT '',
            dispatch_5              TEXT DEFAULT '',
            dispatch_6              TEXT DEFAULT '',
            dispatch_7              TEXT DEFAULT ''
        );

        CREATE INDEX IF NOT EXISTS idx_orders_year      ON orders(year);
        CREATE INDEX IF NOT EXISTS idx_orders_month     ON orders(month);
        CREATE INDEX IF NOT EXISTS idx_orders_order_id  ON orders(internal_order_id);
    """)
    conn.commit()
    conn.close()


def seed_data():
    conn = get_conn()
    count = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    if count > 0:
        conn.close()
        return

    orders = [
        # ===== May 2026 =====
        {
            "year": 2026, "month": "2026-05", "seq_num": "第1单", "intent_date": "2026-05-04",
            "deposit_amount": "是的，定金1w\n【工作微信-2026年5月4日】",
            "contact": "杨凯然",
            "promise_timeframe": "5.8w\n——————\n（修订转）运动医学\nSCI 中二 Q1 出前2作 兼通讯 3-5个月录用，1-2个月检索",
            "internal_order_id": "SCI--ykr050401",
            "initial_title": "Meteorin-like Protein (METRNL): The Exercise Paradox — Systemic Benefits vs. Tumor Immunosuppression in Precision Oncology\n类似Meteorin的蛋白质（METRNL）：运动悖论——精准肿瘤学中的系统性益处 vs. 肿瘤免疫抑制作用",
            "author_table_confirmed": "作者给了，记录在苹果电脑【5月4日】",
            "email_account": "17212@hunnu.edu.cn",
            "all_authors": "Jia Jiang1*",
            "fund_info": "无基金信息",
            "dispatch_1": "1.首次派单时间：5.7\n派给谁：伊朗018\n大概价格：\n——————\n派单表格在哪儿（Link）：https://docs.google.com/spreadsheets/d/1lDIT5QXzXB6o3D7Q7oQ9sUHEFrcY",
        },
        {
            "year": 2026, "month": "2026-05", "seq_num": "第2单", "intent_date": "2026-05-07",
            "deposit_amount": "是的，定金1w\n【建设银行-2026年5月7日10:57】",
            "contact": "社编",
            "promise_timeframe": "3.5w+版面费自理（2800-3550Usd左右）\n（转全篇）心理学方向\nSSCI 中三Q1, 3-4个月录用,1-2个月检索",
            "internal_order_id": "SSCI--sb050701",
            "initial_title": "深度学习驱动的对话系统在抑郁症实时监控与智能诊断中的应用评估\nApplication Evaluation of Deep Learning-Driven Dialogue Systems in Real-time Monitoring and Intelligent Diagnosis of Depression",
            "author_table_confirmed": "作者给了，记录在苹果电脑【5月8日】",
            "email_account": "18777117331zyx@sina.com（赵一璇）\n通讯作者：fufeideng2026@163.com / 密码：198897Zyx",
            "all_authors": "Yixuan Zhao1  Fufei Deng1*",
            "fund_info": "无基金信息",
        },
        {
            "year": 2026, "month": "2026-05", "seq_num": "第3单", "intent_date": "2026-05-07",
            "contact": "张琼",
            "promise_timeframe": "7.5w 全包\n——————\n（全包转）商业管理\nSSCI 中一区 Top,ABS3,出前2作 兼通讯 4-9个月录用，1-2个月检索",
            "internal_order_id": "SSCI--zq050702",
            "initial_title": "Generative AI and Critical Thinking Capability in Business Schools: Toward a Capability Development Model\n商学院中的生成式AI与批判性思维能力：迈向能力开发模型",
            "author_table_confirmed": "作者给了，记录在苹果电脑【5月7日】",
            "email_account": "hanshengmiao12@163.com\n密码：han119120+-",
            "all_authors": "Shengmiao Han1*  Tao Jiang2",
            "fund_info": "无基金信息",
        },
        {
            "year": 2026, "month": "2026-05", "seq_num": "第4单", "intent_date": "2026-05-08",
            "deposit_amount": "是的，定金1w\n【工作微信-2026年5月8日14:06】",
            "contact": "盛琳",
            "promise_timeframe": "9.5w全包\n——————\n（修订转）宏观经济 / 绿色金融\nSSCI 中二Q1 /新锐一区,出前2作兼通讯 3-5个月录用，1-2个月检索",
            "internal_order_id": "SSCI--sl050801",
            "initial_title": "The Impact of Policy Uncertainty on the Intensification of Monetary Contraction Effects on Consumer Behavior\n政策不确定性对货币紧缩加剧及消费者行为的影响",
            "author_table_confirmed": "作者给了，记录在苹果电脑【5月8日】",
            "email_account": "13051136056@163.com（Xiangru Ren）\nkunlunl@cupl.edu.cn（Kunlun Liu）",
            "all_authors": "Xiangru Ren1  Kunlun Liu2*",
            "fund_info": "无基金信息",
            "dispatch_1": "1.首次派单时间：5.8\n派给谁：HJ029\n大概价格：\n——————\n派单表格在哪儿（Link）：",
        },
        {
            "year": 2026, "month": "2026-05", "seq_num": "第5单", "intent_date": "2026-05-09",
            "contact": "张琼",
            "promise_timeframe": "Scopus 8800+版面费自理（500-800usd左右）\n人工智能",
            "internal_order_id": "Scopus--zq050901",
            "initial_title": "AI-Driven Digital Creativity: Conceptual Foundations, Theoretical Framework, and Future Research Directions\n人工智能驱动的数字创意：概念基础、理论框架和未来研究方向",
        },
        {
            "year": 2026, "month": "2026-05", "seq_num": "第6单", "intent_date": "2026-05-11",
            "contact": "周莉莉",
            "promise_timeframe": "3.3w+版面费自理（2100usd左右）\n（修订转）环境政策/经济\nSCI 中四 Q4 出前2作 兼通讯 3-5个月录用，1-2个月检索",
            "internal_order_id": "SCI--zll051201",
            "initial_title": "From Regulation to Sustainability: Green Innovation and Institutional Quality as Key Transmission Channels\n从监管到可持续发展：绿色创新与制度质量作为关键传导渠道",
        },
        {
            "year": 2026, "month": "2026-05", "seq_num": "第7单", "intent_date": "2026-05-12",
            "contact": "周莉莉",
            "promise_timeframe": "5.2w全包\n——————\n（修订转）心理学\nSSCI 中三 Q1,出前1作兼通讯 3-5个月录用，1-2个月检索",
            "internal_order_id": "SSCI-zll051202",
            "initial_title": "Embodied Attention as Distributed Stabilization: Toward a Process Theory of Cognition Across Hybrid Environments\n具身注意力作为分布式稳定机制：迈向跨混合环境认知过程理论",
        },
        # ===== April 2026 (representative sample) =====
        {
            "year": 2026, "month": "2026-04", "seq_num": "第1单", "intent_date": "2026-04-01",
            "contact": "张琼",
            "promise_timeframe": "4.8w 全包\nSSCI 中二 Q2",
            "internal_order_id": "SSCI--zq040101",
            "initial_title": "ESG Performance and Corporate Financial Resilience: Evidence from Emerging Markets\nESG表现与企业财务韧性：来自新兴市场的证据",
            "submission_progress": "外审",
            "author_table_confirmed": "已确认",
            "all_authors": "Wei Chen1*  Li Zhang2",
            "fund_info": "国自然面上项目（No. 72374000）",
        },
        {
            "year": 2026, "month": "2026-04", "seq_num": "第8单", "intent_date": "2026-04-08",
            "contact": "六月初夏",
            "promise_timeframe": "3.2w 全包\nSCI 中三 Q2",
            "internal_order_id": "SCI--lyc040801",
            "initial_title": "Renewable Energy Transition and Carbon Neutrality Pathways in Southeast Asia\n东南亚可再生能源转型与碳中和路径",
            "submission_progress": "修订",
            "deposit_amount": "定金1w",
        },
        {
            "year": 2026, "month": "2026-04", "seq_num": "第12单", "intent_date": "2026-04-12",
            "contact": "龚俊",
            "promise_timeframe": "5.5w 全包\nSSCI 中一区 Q1",
            "internal_order_id": "SSCI--gj041201",
            "initial_title": "Digital Transformation and Organizational Resilience: The Mediating Role of Dynamic Capabilities\n数字化转型与组织韧性：动态能力的中介作用",
            "submission_progress": "提交",
            "deposit_amount": "定金1.5w",
            "author_table_confirmed": "已确认",
        },
        {
            "year": 2026, "month": "2026-04", "seq_num": "第20单", "intent_date": "2026-04-20",
            "contact": "王红",
            "promise_timeframe": "4.2w 全包\nEI JA",
            "internal_order_id": "EI(JA)--wh042001",
            "initial_title": "Smart Manufacturing Quality Control Using Edge AI and Digital Twin Technology\n基于边缘AI与数字孪生的智能制造质量控制",
            "submission_progress": "提交",
        },
        {
            "year": 2026, "month": "2026-04", "seq_num": "第30单", "intent_date": "2026-04-25",
            "contact": "钱鹏",
            "promise_timeframe": "6.8w 全包\nSSCI 中一区 Top",
            "internal_order_id": "SSCI--qp042501",
            "initial_title": "Central Bank Digital Currency and Financial Stability: A Cross-Country Empirical Analysis\n央行数字货币与金融稳定：跨国实证分析",
            "submission_progress": "录用",
            "journal_info": "Journal of International Money and Finance\nhttps://www.sciencedirect.com/journal/journal-of-international-money-and-finance",
            "deposit_amount": "定金2w",
            "all_authors": "Peng Qian1*  Ming Li2  Hong Wang3",
            "fund_info": "教育部人文社科项目（No. 23YJC790000）",
        },
    ]

    sql = """INSERT INTO orders
        (year, month, seq_num, intent_date, continue_status, order_result,
         refunded_continued, deposit_amount, balance_amount, contact,
         promise_timeframe, pub_type, internal_order_id, initial_title,
         submission_progress, status_chart, journal_info, publisher_type,
         author_email_reg, sys_account, divider, author_table_confirmed,
         email_account, all_authors, fund_info, client_instructions,
         response_plan, dispatch_1, dispatch_2, dispatch_3, dispatch_4,
         dispatch_5, dispatch_6, dispatch_7)
        VALUES
        (:year, :month, :seq_num, :intent_date, :continue_status, :order_result,
         :refunded_continued, :deposit_amount, :balance_amount, :contact,
         :promise_timeframe, :pub_type, :internal_order_id, :initial_title,
         :submission_progress, :status_chart, :journal_info, :publisher_type,
         :author_email_reg, :sys_account, :divider, :author_table_confirmed,
         :email_account, :all_authors, :fund_info, :client_instructions,
         :response_plan, :dispatch_1, :dispatch_2, :dispatch_3, :dispatch_4,
         :dispatch_5, :dispatch_6, :dispatch_7)"""

    defaults = {k: "" for k in [
        "seq_num", "intent_date", "continue_status", "order_result",
        "refunded_continued", "deposit_amount", "balance_amount", "contact",
        "promise_timeframe", "pub_type", "internal_order_id", "initial_title",
        "submission_progress", "status_chart", "journal_info", "publisher_type",
        "author_email_reg", "sys_account", "divider", "author_table_confirmed",
        "email_account", "all_authors", "fund_info", "client_instructions",
        "response_plan", "dispatch_1", "dispatch_2", "dispatch_3", "dispatch_4",
        "dispatch_5", "dispatch_6", "dispatch_7",
    ]}

    safe_orders = []
    for o in orders:
        row = {k: o.get(k, defaults[k]) for k in defaults}
        row["year"] = o["year"]
        row["month"] = o["month"]
        safe_orders.append(row)

    conn.executemany(sql, safe_orders)
    conn.commit()

    # Seed some demo cell changes so history tooltip is visible
    if conn.execute("SELECT COUNT(*) FROM cell_changes").fetchone()[0] == 0:
        demos = [
            (1, "intent_date", "", "2026-05-04", "陈维山", "2026-05-04 09:15"),
            (1, "contact", "", "杨凯然", "陈维山", "2026-05-04 09:16"),
            (2, "submission_progress", "", "外审", "陈维山", "2026-05-08 14:20"),
            (2, "deposit_amount", "", "是的，定金1w", "陈维山", "2026-05-08 14:21"),
            (3, "contact", "", "张琼", "陈维山", "2026-05-07 10:05"),
        ]
        conn.executemany(
            "INSERT INTO cell_changes (order_id, column_name, old_value, new_value, changed_by, changed_at) VALUES (?,?,?,?,?,?)",
            demos,
        )
        conn.commit()

    # Seed index types
    if conn.execute("SELECT COUNT(*) FROM index_types").fetchone()[0] == 0:
        for t in ["SSCI", "SCI", "EI(JA)", "EI(CA)", "Scopus", "AHCI"]:
            conn.execute("INSERT INTO index_types (name) VALUES (?)", (t,))
        conn.commit()

    # Seed channels
    if conn.execute("SELECT COUNT(*) FROM channels").fetchone()[0] == 0:
        seed_channels = [
            ("伊朗018", "谷歌表单", "SCI多学科", "写手", 4, "响应快，质量稳定"),
            ("HJ029", "谷歌表单", "SSCI经济管理", "写手", 3, ""),
            ("KK-编辑007", "微信", "SCI/SSCI全科", "编辑", 5, "某出版社在职编辑"),
            ("资源-李明", "朋友介绍", "EI工程", "中间人", 3, "能对接多个写手团队"),
        ]
        conn.executemany(
            "INSERT INTO channels (name, platform, direction, role, rating, notes) VALUES (?,?,?,?,?,?)",
            seed_channels,
        )
        conn.commit()

    conn.close()


# ---- Query Functions ----


def list_orders(year=None, month=None, status=None, search="", channel=None, page=1, page_size=20):
    conn = get_conn()
    conditions = []
    params = []

    if year:
        conditions.append("year = ?")
        params.append(int(year))
    if month:
        conditions.append("month = ?")
        params.append(month)
    if status:
        # Support comma-separated OR values (e.g. "出版,检索") and special "进行中" → "提交","外审"
        if status == "进行中":
            conditions.append("submission_progress IN (?,?)")
            params.extend(["提交", "外审"])
        elif "," in status:
            parts = [s.strip() for s in status.split(",") if s.strip()]
            placeholders = ",".join(["?"] * len(parts))
            conditions.append(f"submission_progress IN ({placeholders})")
            params.extend(parts)
        else:
            conditions.append("submission_progress = ?")
            params.append(status)
    if channel:
        # Prefix match on internal_order_id (e.g. "SSCI" matches "SSCI--xxx")
        conditions.append("internal_order_id LIKE ?")
        params.append(f"{channel}%")
    if search:
        like = f"%{search}%"
        conditions.append(
            "(internal_order_id LIKE ? OR contact LIKE ? OR initial_title LIKE ?"
            " OR seq_num LIKE ? OR promise_timeframe LIKE ?)"
        )
        params.extend([like, like, like, like, like])

    where = " AND ".join(conditions) if conditions else "1=1"

    total = conn.execute(f"SELECT COUNT(*) FROM orders WHERE {where}", params).fetchone()[0]
    offset = (page - 1) * page_size
    rows = conn.execute(
        f"SELECT * FROM orders WHERE {where} ORDER BY month DESC, seq_num ASC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()

    conn.close()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "orders": [dict(r) for r in rows],
    }


def get_stats():
    conn = get_conn()
    total = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]

    progress_counts = dict(conn.execute(
        "SELECT submission_progress, COUNT(*) as cnt FROM orders WHERE submission_progress != '' GROUP BY submission_progress"
    ).fetchall())

    month_counts = dict(conn.execute(
        "SELECT month, COUNT(*) as cnt FROM orders GROUP BY month ORDER BY month"
    ).fetchall())

    # This month stats
    this_month = conn.execute(
        "SELECT COUNT(*) FROM orders WHERE month = (SELECT MAX(month) FROM orders)"
    ).fetchone()[0]

    accepted = progress_counts.get("录用", 0)
    acceptance_rate = round(accepted / total * 100, 1) if total > 0 else 0

    in_progress = sum(v for k, v in progress_counts.items() if k in ("提交", "外审"))
    revising = progress_counts.get("修订", 0)
    published = progress_counts.get("出版", 0)
    indexed = progress_counts.get("检索", 0)

    # Channel breakdown (from internal_order_id prefix)
    rows = conn.execute(
        "SELECT internal_order_id, submission_progress FROM orders WHERE internal_order_id != ''"
    ).fetchall()
    channel_total = {}
    channel_accepted = {}
    for r in rows:
        oid = r["internal_order_id"]
        prog = r["submission_progress"]
        prefix = oid.split("--")[0] if "--" in oid else oid.split("-")[0] if "-" in oid else "其他"
        channel_total[prefix] = channel_total.get(prefix, 0) + 1
        if prog == "录用":
            channel_accepted[prefix] = channel_accepted.get(prefix, 0) + 1

    channels = []
    for ch, cnt in sorted(channel_total.items(), key=lambda x: -x[1]):
        acc = channel_accepted.get(ch, 0)
        channels.append({"name": ch, "total": cnt, "accepted": acc, "rate": round(acc / cnt * 100, 1) if cnt > 0 else 0})

    # Dispatch stats: count orders with at least 1 dispatch, extract writers
    dispatch_rows = conn.execute(
        "SELECT dispatch_1, dispatch_2, dispatch_3, dispatch_4, dispatch_5, dispatch_6, dispatch_7 FROM orders"
    ).fetchall()

    import re
    writer_set = set()
    dispatched_count = 0
    for r in dispatch_rows:
        has_dispatch = False
        for key in ["dispatch_1", "dispatch_2", "dispatch_3", "dispatch_4", "dispatch_5", "dispatch_6", "dispatch_7"]:
            text = r[key] or ""
            if text.strip():
                has_dispatch = True
                m = re.search(r"派给谁[：:]\s*(.+?)(?:\n|$)", text)
                if m:
                    writer_set.add(m.group(1).strip())
        if has_dispatch:
            dispatched_count += 1

    conn.close()
    return {
        "total": total,
        "this_month": this_month,
        "not_dispatched": total - dispatched_count,
        "in_progress": in_progress,
        "revising": revising,
        "accepted": accepted,
        "published": published,
        "indexed": indexed,
        "acceptance_rate": acceptance_rate,
        "channels": channels,
        "channel_count": len(channel_total),
        "dispatched_count": dispatched_count,
        "writer_count": len(writer_set),
        "month_counts": month_counts,
        "progress_counts": progress_counts,
    }


def create_order(data):
    conn = get_conn()
    fields = [
        "year", "month", "seq_num", "intent_date", "continue_status",
        "order_result", "refunded_continued", "deposit_amount", "balance_amount",
        "contact", "promise_timeframe", "pub_type", "internal_order_id",
        "initial_title", "submission_progress", "status_chart", "journal_info",
        "publisher_type", "author_email_reg", "sys_account", "divider",
        "author_table_confirmed", "email_account", "all_authors", "fund_info",
        "client_instructions", "response_plan",
        "dispatch_1", "dispatch_2", "dispatch_3", "dispatch_4",
        "dispatch_5", "dispatch_6", "dispatch_7",
    ]
    vals = {f: data.get(f, "") for f in fields}
    placeholders = ", ".join(f":{f}" for f in fields)
    cols = ", ".join(fields)
    sql = f"INSERT INTO orders ({cols}) VALUES ({placeholders})"
    cur = conn.execute(sql, vals)
    conn.commit()
    row_id = cur.lastrowid
    conn.close()
    return row_id


def update_order(order_id, data):
    conn = get_conn()
    fields = [
        "year", "month", "seq_num", "intent_date", "continue_status",
        "order_result", "refunded_continued", "deposit_amount", "balance_amount",
        "contact", "promise_timeframe", "pub_type", "internal_order_id",
        "initial_title", "submission_progress", "status_chart", "journal_info",
        "publisher_type", "author_email_reg", "sys_account", "divider",
        "author_table_confirmed", "email_account", "all_authors", "fund_info",
        "client_instructions", "response_plan",
        "dispatch_1", "dispatch_2", "dispatch_3", "dispatch_4",
        "dispatch_5", "dispatch_6", "dispatch_7",
    ]
    sets = ", ".join(f"{f} = :{f}" for f in fields)
    vals = {f: data.get(f, "") for f in fields}
    vals["id"] = order_id
    conn.execute(f"UPDATE orders SET {sets} WHERE id = :id", vals)
    conn.commit()
    conn.close()


def delete_order(order_id):
    conn = get_conn()
    conn.execute("DELETE FROM cell_changes WHERE order_id = ?", (order_id,))
    conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()


def log_cell_change(order_id, column_name, old_value, new_value, changed_by="Admin"):
    if old_value == new_value:
        return
    conn = get_conn()
    conn.execute(
        "INSERT INTO cell_changes (order_id, column_name, old_value, new_value, changed_by) VALUES (?,?,?,?,?)",
        (order_id, column_name, old_value or "", new_value or "", changed_by),
    )
    conn.commit()
    conn.close()


def get_cell_history(order_id, column_name, limit=5):
    conn = get_conn()
    rows = conn.execute(
        "SELECT old_value, new_value, changed_by, changed_at FROM cell_changes WHERE order_id=? AND column_name=? ORDER BY id DESC LIMIT ?",
        (order_id, column_name, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ---- Channel CRUD ----

def list_channels():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM channels ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_channel(data):
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO channels (name, platform, direction, role, rating, notes) VALUES (?,?,?,?,?,?)",
        (data.get("name", "").strip(), data.get("platform", "").strip(),
         data.get("direction", "").strip(), data.get("role", "").strip(),
         int(data.get("rating", 3)), data.get("notes", "").strip()),
    )
    conn.commit()
    rid = cur.lastrowid
    conn.close()
    return rid


def update_channel(channel_id, data):
    conn = get_conn()
    conn.execute(
        "UPDATE channels SET name=?, platform=?, direction=?, role=?, rating=?, notes=? WHERE id=?",
        (data.get("name", "").strip(), data.get("platform", "").strip(),
         data.get("direction", "").strip(), data.get("role", "").strip(),
         int(data.get("rating", 3)), data.get("notes", "").strip(),
         channel_id),
    )
    conn.commit()
    conn.close()


def delete_channel(channel_id):
    conn = get_conn()
    conn.execute("DELETE FROM channels WHERE id=?", (channel_id,))
    conn.commit()
    conn.close()


def get_channel_stats():
    conn = get_conn()
    total = conn.execute("SELECT COUNT(*) FROM channels").fetchone()[0]
    this_month = conn.execute(
        "SELECT COUNT(*) FROM channels WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')"
    ).fetchone()[0]
    conn.close()
    return {"total": total, "this_month": this_month}


# ---- Index Type CRUD ----

def list_index_types():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM index_types ORDER BY name").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_index_type(data):
    conn = get_conn()
    name = data.get("name", "").strip()
    if not name: return None
    cur = conn.execute("INSERT OR IGNORE INTO index_types (name) VALUES (?)", (name,))
    conn.commit()
    rid = cur.lastrowid
    conn.close()
    return rid


def delete_index_type(type_id):
    conn = get_conn()
    conn.execute("DELETE FROM index_types WHERE id=?", (type_id,))
    conn.commit()
    conn.close()
