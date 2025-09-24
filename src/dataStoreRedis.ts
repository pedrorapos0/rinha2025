import { redisConnection } from "./redisConnectionManager";

export type Payment = {
    correlationId: string;
    amount: number;
    requestedAt: string;
};

export type ResponseServiceHealth = {
    failing: boolean,
    minResponseTime: number
};

export type ResponsePaymentSummary = {
    default: {
      totalRequests: number,
      totalAmount: any
    },
    fallback: {
      totalRequests: number,
      totalAmount: any
    }
}

const redisClient = redisConnection.getClient();



 export async function createConnectionRedis() {
    await redisConnection.connect();
 }

  export async function closeConnectionRedis() {
    await redisClient.close();
 }   
 

export async function receivePayment(correlationId: string, amount: number): Promise<void> {
     const requestedAt = new Date().toISOString();
        await redisClient.hSet(`payment:${requestedAt}`, {
            correlationId,
            "amount": amount,
            "requestedAt" : `${requestedAt}`,
            "paymentProcessor": '',
            "status_process": 'received',
        });
}

export async function updatePaymentProcessorField(payment: Payment, paymentProcessor: string): Promise<void> {
     
        await redisClient.hSet(`payment:${payment.requestedAt}`, {
            correlationId: payment.correlationId,
            amount: payment.amount,
            requestedAt : payment.requestedAt,
            paymentProcessor,
            status_process: 'processed',
        });
}

export async function paymentsSummary(from: string, to: string) : Promise<ResponsePaymentSummary> {
     
 const payments: any[] = [];
        const scanOption = {MATCH: 'payment:*'}
        for await (const keys of redisClient.scanIterator(scanOption)) {
             for(let i=0; i<keys.length; i++){
                const payment = await redisClient.hGetAll(keys[i] as string);
                payments.push(payment);
             }
        }

        if(from && to){
           const filteredPaymentsDefault = payments.filter(payment => new Date(payment.requestedAt) 
           >= new Date(from) && new Date(payment.requestedAt) <= new Date(to) && payment.paymentProcessor==='default');
           let totalAmountDefault = filteredPaymentsDefault.reduce(
            (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount), 0,);

            const filteredPaymentsFallback = payments.filter(payment => new Date(payment.requestedAt) 
           >= new Date(from) && new Date(payment.requestedAt) <= new Date(to) && payment.paymentProcessor==='fallback');
           let totalAmountfallback = filteredPaymentsDefault.reduce(
            (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount), 0,);



            const summary = {default:{
               totalRequests:filteredPaymentsDefault.length,
               totalAmount:totalAmountDefault
               }
         
            ,fallback:{
               totalRequests:filteredPaymentsFallback.length,
               totalAmount:totalAmountfallback
               }
            };
           
           return summary;
        }
       let totalAmountDefault = payments.filter(payment => payment.paymentProcessor==='default').reduce(
            (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount), 0,);
            

        let totalAmountFallback =  payments.filter(payment => payment.paymentProcessor==='fallback').reduce(
            (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount), 0,);
            

            const summary = {default:{
               totalRequests:payments.filter(payment => payment.paymentProcessor==='default').length,
               totalAmount:totalAmountDefault
               }
         
            ,fallback:{
               totalRequests:payments.filter(payment => payment.paymentProcessor==='fallback').length,
               totalAmount:totalAmountFallback
               }
            };
           

            return summary;

}

export async function listPaymentsReceived() : Promise<Payment[]> {
     
 const payments: any[] = [];
        const scanOption = {MATCH: 'payment:*'}
        for await (const keys of redisClient.scanIterator(scanOption)) {
             for(let i=0; i<keys.length; i++){
                const payment = await redisClient.hGetAll(keys[i] as string);
                if(payment.status_process==='received'){
                   payments.push(payment);
                }
             }
        }
      
        return payments.map(payment => {
            return {
                correlationId: payment.correlationId,
                amount: parseFloat(payment.amount),
                requestedAt: payment.requestedAt
            }
        });

}