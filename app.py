from flask import Flask, render_template, request, jsonify
import stripe
import os
import dotenv  # Import the dotenv library

# Import create_client and Client from the supabase library
from supabase import create_client, Client

# Load environment variables from the .env file
dotenv.load_dotenv()

app = Flask(__name__, template_folder="html")  # tell Flask where your templates live

# Set your Stripe secret key (use env var for security)
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')  # Replace with your actual secret key if not using env

# Initialize Supabase client
supabase: Client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/shop")
def shop():
    return render_template("shop.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

@app.route("/cart")
def cart():
    return render_template("cart.html")

@app.route("/checkout")
def checkout():
    return render_template("checkout.html")

@app.route('/create-payment-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        cart = data.get('cart', [])  # Expecting array of {product_id, qty}
        email = data.get('customerEmail')

        # Log the incoming cart data to help with debugging client-side issues
        print("Received cart data:", cart)

        if not cart:
            return jsonify({'error': 'Cart is empty'}), 400

        # Validate that each item has a product_id
        for item in cart:
            if 'product_id' not in item:
                return jsonify({'error': 'Invalid cart format: each item must have a "product_id"'}), 400

        # Fetch product details from Supabase to calculate amount securely (don't trust client-side prices)
        product_ids = [item['product_id'] for item in cart]
        response = supabase.table('products').select('id, price').in_('id', product_ids).execute()
        products = {p['id']: p['price'] for p in response.data}

        # Calculate total amount in cents
        amount = 0
        for item in cart:
            price = products.get(item['product_id'], 0)
            amount += int(price * item['qty'] * 100)  # Convert to cents
        amount += 1000  # Add €10 shipping in cents

        if amount <= 0:
            return jsonify({'error': 'Invalid cart amount'}), 400

        # Create the PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='eur',  # Adjust if needed
            automatic_payment_methods={'enabled': True},
            receipt_email=email,
        )

        return jsonify({'clientSecret': intent['client_secret']})
    except Exception as e:
        print(f"Error creating PaymentIntent: {e}")  # Log for debugging
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
