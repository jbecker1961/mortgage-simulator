import streamlit as st
import pandas as pd

st.set_page_config(page_title="Mortgage Scenario Simulator", layout="wide")
st.title("Mortgage Scenario Simulator")

# -----------------------------
# Helpers
# -----------------------------
def fixed_monthly_pi(loan_amount: float, annual_rate_pct: float, term_years: int) -> float:
    """Monthly principal+interest for fully-amortizing fixed-rate mortgage."""
    if loan_amount <= 0:
        return 0.0
    n = int(term_years) * 12
    r = (annual_rate_pct / 100.0) / 12.0
    if r == 0:
        return loan_amount / n
    return loan_amount * (r * (1 + r) ** n) / ((1 + r) ** n - 1)


def io_monthly_interest_only(loan_amount: float, annual_rate_pct: float) -> float:
    """Monthly interest-only payment."""
    if loan_amount <= 0:
        return 0.0
    r = (annual_rate_pct / 100.0) / 12.0
    return loan_amount * r


def money(x: float) -> str:
    return f"${x:,.0f}"


def init_list_state(key: str, default_item: dict):
    if key not in st.session_state:
        st.session_state[key] = [default_item]


def sum_amounts(key: str) -> float:
    return float(sum(item.get("amount", 0.0) for item in st.session_state.get(key, [])))


def render_dynamic_items(key: str, amount_label: str, add_button_label: str, default_name: str):
    """Render a dynamic list of labeled $ amounts with Add/Remove."""
    if st.button(add_button_label, key=f"{key}_add"):
        st.session_state[key].append({"name": default_name, "amount": 0.0})

    remove_index = None
    for i, item in enumerate(st.session_state[key]):
        c1, c2, c3 = st.columns([2.2, 1.6, 0.8])
        with c1:
            item["name"] = st.text_input(
                "Label",
                value=item.get("name", ""),
                key=f"{key}_name_{i}",
                label_visibility="collapsed",
            )
        with c2:
            item["amount"] = st.number_input(
                amount_label,
                min_value=0.0,
                value=float(item.get("amount", 0.0)),
                step=25.0,
                key=f"{key}_amt_{i}",
                label_visibility="collapsed",
            )
        with c3:
            if st.button("Remove", key=f"{key}_remove_{i}"):
                remove_index = i

    if remove_index is not None:
        st.session_state[key].pop(remove_index)
        st.rerun()


# -----------------------------
# Initialize dynamic lists
# -----------------------------
init_list_state("baseline_cars", {"name": "Car #1", "amount": 1286.0})
init_list_state("baseline_other_fixed", {"name": "Other fixed #1", "amount": 0.0})
init_list_state("baseline_removable", {"name": "Landscaping", "amount": 300.0})
init_list_state("scenario_other_monthly", {"name": "Pool / other", "amount": 130.0})

# -----------------------------
# SIDEBAR: Inputs
# -----------------------------
with st.sidebar:
    st.header("Inputs")

    st.subheader("New scenario")

    home_price = st.number_input("Home price", min_value=0.0, value=1_650_000.0, step=10_000.0)
    down_payment = st.number_input("Down payment", min_value=0.0, value=365_000.0, step=10_000.0)

    mortgage_type = st.selectbox("Mortgage", ["30-year fixed", "7/1 Interest-Only (IO)"])
    interest_rate = st.number_input("Rate (%)", min_value=0.0, value=5.7, step=0.05)

    colA, colB = st.columns(2)
    with colA:
        hoa_monthly = st.number_input("HOA ($/mo)", min_value=0.0, value=330.0, step=25.0)
    with colB:
        pmi_monthly = st.number_input("PMI ($/mo)", min_value=0.0, value=0.0, step=25.0)

    st.markdown("---")
    st.subheader("Taxes & insurance")

    tax_mode = st.radio("Property tax", ["$ / year", "% of price"], horizontal=True)
    if tax_mode == "$ / year":
        annual_taxes = st.number_input("Property tax ($/yr)", min_value=0.0, value=24_000.0, step=500.0)
        tax_rate_pct = None
    else:
        tax_rate_pct = st.number_input(
            "Property tax rate (% of price)",
            min_value=0.0,
            value=1.45,
            step=0.05,
            help="Example: 1.45% = enter 1.45",
        )
        annual_taxes = home_price * (tax_rate_pct / 100.0)

    annual_insurance = st.number_input("Insurance ($/yr)", min_value=0.0, value=4_000.0, step=250.0)

    st.markdown("---")
    with st.expander("Monthly add-ons (new scenario)", expanded=False):
        st.caption("Examples: pool, private HOA add-ons, extra utilities, etc.")
        render_dynamic_items(
            key="scenario_other_monthly",
            amount_label="$/mo",
            add_button_label="+ Add add-on",
            default_name="New add-on",
        )

    st.markdown("---")
    st.subheader("Today (baseline)")

    current_mortgage_allin = st.number_input("Current all-in mortgage ($/mo)", min_value=0.0, value=3_550.0, step=50.0)

    with st.expander("Cars (baseline)", expanded=False):
        render_dynamic_items(
            key="baseline_cars",
            amount_label="$/mo",
            add_button_label="+ Add car",
            default_name="Car",
        )

    with st.expander("Other fixed bills (baseline)", expanded=False):
        st.caption("Anything you consider part of your fixed monthly baseline.")
        render_dynamic_items(
            key="baseline_other_fixed",
            amount_label="$/mo",
            add_button_label="+ Add fixed bill",
            default_name="Fixed bill",
        )

    with st.expander("Removable expenses (go away in the new scenario)", expanded=False):
        st.caption("Examples: landscaping, club membership, etc.")
        render_dynamic_items(
            key="baseline_removable",
            amount_label="$/mo",
            add_button_label="+ Add removable",
            default_name="Removable",
        )

    st.markdown("---")
    st.subheader("State income tax")

    current_state_tax_m = st.number_input(
        "Current state tax withheld ($/mo)",
        min_value=0.0,
        value=2000.0,
        step=50.0,
        help="Approx monthly NJ withholding / effective state income tax.",
    )
    new_state_tax_m = st.number_input(
        "New state tax withheld ($/mo)",
        min_value=0.0,
        value=0.0,
        step=50.0,
        help="If moving to FL, this is typically $0.",
    )


# -----------------------------
# Calculations
# -----------------------------
loan_amount = max(0.0, home_price - down_payment)
monthly_taxes = annual_taxes / 12.0
monthly_ins = annual_insurance / 12.0

scenario_other_total = sum_amounts("scenario_other_monthly")
baseline_car_total = sum_amounts("baseline_cars")
baseline_other_fixed_total = sum_amounts("baseline_other_fixed")
removable_total = sum_amounts("baseline_removable")

# Mortgage payment
if mortgage_type == "30-year fixed":
    scenario_pi = fixed_monthly_pi(loan_amount, interest_rate, 30)
    scenario_pi_label = "P&I (30y fixed)"
    post_io_estimate = None
else:
    scenario_pi = io_monthly_interest_only(loan_amount, interest_rate)
    scenario_pi_label = "Interest-only (7/1 IO)"
    post_io_estimate = fixed_monthly_pi(loan_amount, interest_rate, 23)  # rough placeholder

new_total_ex_state_tax = (
    scenario_pi
    + monthly_taxes
    + monthly_ins
    + hoa_monthly
    + pmi_monthly
    + scenario_other_total
)
new_total_all_in = new_total_ex_state_tax + new_state_tax_m

baseline_total_ex_state_tax = current_mortgage_allin + baseline_car_total + baseline_other_fixed_total
baseline_total_all_in = baseline_total_ex_state_tax + current_state_tax_m

# Net change includes: new - today - removables eliminated
net_monthly_change = (new_total_all_in - baseline_total_all_in) - removable_total


# -----------------------------
# MAIN PAGE: Results
# -----------------------------
# Top KPI row
k1, k2, k3 = st.columns(3)
k1.metric("New monthly (all-in)", money(new_total_all_in))
k2.metric("Today monthly (all-in)", money(baseline_total_all_in))
k3.metric("Delta vs today", money(net_monthly_change))

if net_monthly_change > 0:
    st.error("This scenario increases your monthly spend (after removables + state tax change).")
elif net_monthly_change < 0:
    st.success("This scenario reduces your monthly spend (after removables + state tax change).")
else:
    st.info("Net neutral.")

# Summary context
st.caption(f"Loan amount: {money(loan_amount)} • Rate: {interest_rate:.2f}% • Mortgage: {mortgage_type}")

# Optional helpful tax display
if tax_mode == "% of price" and tax_rate_pct is not None:
    st.caption(f"Property tax computed as {tax_rate_pct:.2f}% of price → {money(annual_taxes)}/yr ({money(monthly_taxes)}/mo)")

# Breakdown tables
st.subheader("Breakdown")

left, right = st.columns(2)

with left:
    st.markdown("### New scenario (monthly)")
    new_rows = [
        (scenario_pi_label, scenario_pi),
        ("Property tax", monthly_taxes),
        ("Insurance", monthly_ins),
        ("HOA", hoa_monthly),
        ("PMI", pmi_monthly),
        ("Monthly add-ons", scenario_other_total),
        ("State income tax", new_state_tax_m),
    ]
    new_df = pd.DataFrame(new_rows, columns=["Line item", "Amount"])
    new_df["Amount"] = new_df["Amount"].astype(float)
    st.dataframe(
        new_df.style.format({"Amount": "${:,.0f}"}),
        use_container_width=True,
        hide_index=True,
    )

    st.markdown(f"**Total (all-in): {money(new_total_all_in)}**")

    if mortgage_type != "30-year fixed" and post_io_estimate is not None:
        st.caption(f"Post-IO rough estimate (after 7 yrs, amortize over 23 yrs @ same rate): {money(post_io_estimate)}")

with right:
    st.markdown("### Today (baseline) (monthly)")
    base_rows = [
        ("Current mortgage (all-in)", current_mortgage_allin),
        ("Cars (total)", baseline_car_total),
        ("Other fixed bills (total)", baseline_other_fixed_total),
        ("State income tax", current_state_tax_m),
        ("Removable expenses (eliminated)", removable_total),
    ]
    base_df = pd.DataFrame(base_rows, columns=["Line item", "Amount"])
    base_df["Amount"] = base_df["Amount"].astype(float)
    st.dataframe(
        base_df.style.format({"Amount": "${:,.0f}"}),
        use_container_width=True,
        hide_index=True,
    )

    st.markdown(f"**Total today (all-in): {money(baseline_total_all_in)}**")
    st.caption("Removable expenses are subtracted from the delta (assumed to go away in the new scenario).")