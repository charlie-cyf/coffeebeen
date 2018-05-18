# Coffee Maker

## Specifications

1. Coffee makers should be created with a unique 12-character alphanumeric serial number, full hoppers of coffee, and should start ready to brew coffee.
2. Users should be able to brew a quantity of a type of coffee in a hopper. Coffee can only be brewed when the machine is not already brewing.
3. Users should be able to refill hoppers with the same kind of coffee bean up to its capacity when the hopper is not brewing. After refilling the hopper, the refill light should be off.
4. If any hopper empties to below 30% of its capacity, the refill light should turn on and the machine should place an order to completely refill the hopper. Orders are placed by POSTing the object `{serialNo: string, kind: CoffeeKind, qty: number}` to http://jsonplaceholder.typicode.com/orders. If an order cannot be placed, the refill light should blink.
5. After brewing 10L of coffee, the maintenance light should turn on and the machine should request maintenance. Maintenance can be requested by POSTing the object `{serialNo: string}` to http://jsonplaceholder.typicode.com/maintenanceRequests. If the maintenance request fails, the maintenance light should blink.
6. When the reset button is pressed, the amount brewed counter should reset and the maintenance light should be off.
