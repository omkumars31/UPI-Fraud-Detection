const SENDERS = [
  { name: 'Rahul Sharma',  upiId: 'rahul.sharma@okicici',   city: 'Mumbai'    },
  { name: 'Priya Patel',   upiId: 'priya.patel@okhdfcbank', city: 'Ahmedabad' },
  { name: 'Arjun Mehta',   upiId: 'arjun.mehta@okaxis',     city: 'Delhi'     },
  { name: 'Sneha Reddy',   upiId: 'sneha.reddy@ybl',        city: 'Hyderabad' },
  { name: 'Vikram Singh',  upiId: 'vikram.singh@okicici',   city: 'Jaipur'    },
  { name: 'Ananya Iyer',   upiId: 'ananya.iyer@okhdfcbank', city: 'Chennai'   },
  { name: 'Rohan Gupta',   upiId: 'rohan.gupta@okaxis',     city: 'Pune'      },
  { name: 'Kavya Nair',    upiId: 'kavya.nair@ybl',         city: 'Kochi'     },
];

const RECEIVERS = [
  // Common merchants (legit)
  { name: 'Swiggy',       upiId: 'swiggy@icici'        },
  { name: 'Zomato',       upiId: 'zomato@kotak'        },
  { name: 'Amazon Pay',   upiId: 'amazon@apl'          },
  { name: 'Flipkart',     upiId: 'flipkart@ybl'        },
  { name: 'BookMyShow',   upiId: 'bookmyshow@hdfcbank' },
  { name: 'Ola Cabs',     upiId: 'ola@okicici'         },
  { name: 'Paytm Mall',   upiId: 'paytmmall@paytm'     },
  { name: 'IRCTC',        upiId: 'irctc@sbi'           },
  // Personal (legit)
  { name: 'Deepak Verma', upiId: 'deepak.v@okhdfcbank' },
  { name: 'Meera Joshi',  upiId: 'meera.j@okaxis'      },
  // Suspicious
  { name: 'Unknown',      upiId: 'qr8823x@ybl'         },
  { name: 'Unknown',      upiId: 'temp.acc9@paytm'     },
  { name: 'Unknown',      upiId: 'xfer.now@okicici'    },
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Pune', 'Ahmedabad', 'Jaipur', 'Kolkata', 'Kochi',
];

const DEVICE_IDS = [
  'AND-SM-G991B', 'IOS-IPHONE14', 'AND-PIXEL7',    'AND-ONEPLUS11',
  'IOS-IPHONE13', 'AND-REDMI12',  'IOS-IPHONE15',  'AND-MOTO-G84',
];

module.exports = { SENDERS, RECEIVERS, CITIES, DEVICE_IDS };