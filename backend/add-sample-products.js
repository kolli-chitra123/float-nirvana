const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function addSampleProducts() {
  console.log('🛍️ Adding Sample Products...\n');
  
  const products = [
    {
      name: 'Wellness Essential Kit',
      description: 'Complete wellness package with aromatherapy oils, meditation guide, and relaxation accessories',
      price: 2500,
      category: 'wellness',
      stockQuantity: 50
    },
    {
      name: 'Float Tank Accessories',
      description: 'Premium earplugs, neck pillow, and towel set for enhanced floating experience',
      price: 800,
      category: 'accessories',
      stockQuantity: 100
    },
    {
      name: 'Magnesium Supplements',
      description: 'High-quality magnesium supplements to enhance relaxation and muscle recovery',
      price: 1200,
      category: 'supplements',
      stockQuantity: 75
    },
    {
      name: 'Meditation Cushion Set',
      description: 'Comfortable meditation cushions with organic cotton cover',
      price: 1800,
      category: 'wellness',
      stockQuantity: 30
    },
    {
      name: 'Gift Card - 3 Sessions',
      description: 'Perfect gift for loved ones - includes 3 float sessions of choice',
      price: 7500,
      category: 'gift-cards',
      stockQuantity: 999
    },
    {
      name: 'Aromatherapy Oil Set',
      description: 'Premium essential oils for relaxation: lavender, eucalyptus, and chamomile',
      price: 1500,
      category: 'wellness',
      stockQuantity: 60
    }
  ];
  
  for (const product of products) {
    try {
      console.log(`📦 Adding: ${product.name}`);
      
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added: ${result.name} (₹${result.price})`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed to add ${product.name}: ${error.error}`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${product.name}:`, error.message);
    }
  }
  
  // Verify products were added
  console.log('\n📊 Checking products in database...');
  try {
    const response = await fetch('http://localhost:3001/api/products');
    const products = await response.json();
    
    console.log(`📈 Total products: ${products.length}`);
    products.forEach(product => {
      console.log(`🛍️ ${product.name} - ₹${product.price} (${product.category})`);
    });
  } catch (error) {
    console.error('❌ Failed to fetch products:', error.message);
  }
  
  console.log('\n🎉 Sample Products Added Successfully!');
}

addSampleProducts();
