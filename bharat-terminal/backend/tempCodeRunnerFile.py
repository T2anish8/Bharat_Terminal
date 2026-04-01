def dydx_simple(x):
    return 2*x

x_val = 2
derivative = dydx_simple(x_val)
print(f"The derivative of y = x^2 at x = {x_val} is {derivative}")





def dydx_simple(x):
    return 2*x

x_val = 2
derivative = dydx_simple(x_val)
print(f"The derivative of y = x^2 at x = {x_val} is {derivative}")

x_val = 3
derivative = dydx_simple(x_val)
print(f"The derivative of y = x^2 at x = {x_val} is {derivative}")


import torch
x=torch.tensor(2.0, requires_grad=True)
y=x**2
y.backward()
print("DY/DX=",y)

import torch
x=torch.tensor(3.0, requires_grad=True)
y=x**2
print("y sqrt=",y)
y.backward()
print("DY/DX=",x.grad)

import torch
x=torch.tensor(3.0, requires_grad=True)
y=3*x +5
print("y sqrt=",y)
y.backward()
print("DY/DX=",x.grad)




import torch 
import torch.nn as nn
import torch.optim as optim
x=torch.tensor([[1.],[2.],[3.],[4.]])
y=torch.tensor([[2.],[4.],[6.],[8.]])
model=nn.Linear(1,1)
criterion=nn.MSELoss()
optimizer=optim.Adam(model.parameters(),lr=0.01) 
for epoch in range(100):
    optimizer.zero_grad()
    y_pred=model(x)
    loss=criterion(y_pred,y)
    loss.backward()
    optimizer.step()
    print(model.weight)


import torch 
import torch.nn as nn
x=torch.tensor([[1.],[2.],[3.],[4.]])
y=torch.tensor([[2.],[4.],[6.],[8.]])
model=nn.Linear(1,1)   
y_pred=model(x)
print(y_pred)
loss_fn=nn.MSELoss()
loss=loss_fn(y_pred,y)
print(loss)

import torch
from torch.utils.data import Dataset

class MyDataset(Dataset):
    def __init__(self):
        self.x = torch.tensor([[1.0],[2.0],[3.0],[4.0]])
        self.y = torch.tensor([[2.0],[4.0],[6.0],[8.0]])

    def __len__(self):
        return len(self.x)

    def __getitem__(self, idx):
        return self.x[idx], self.y[idx]


dataset = MyDataset()

print(len(dataset))
print(dataset[0])
import torch
from torch.utils.data import Dataset

class MyDataset(Dataset):
    def __init__(self):
        self.x = torch.tensor([[1.0],[2.0],[3.0],[4.0]])
        self.y = torch.tensor([[1.0],[8.0],[27.0],[64.0]])

    def __len__(self):
        return len(self.x)

    def __getitem__(self, idx):
        return self.x[idx], self.y[idx]


dataset = MyDataset()

print(len(dataset))
print(dataset[0])
import torch
from torch.utils.data import Dataset

class StudyDataset(Dataset):
    def __init__(self):
        # Hours studied
        self.x = torch.tensor([[1.0],[2.0],[3.0],[4.0],[5.0],[6.0]])

        # Marks obtained
        self.y = torch.tensor([[20.0],[35.0],[50.0],[65.0],[80.0],[95.0]])

    def __len__(self):
        return len(self.x)

    def __getitem__(self, idx):
        return self.x[idx], self.y[idx]

dataset = StudyDataset()

print("Total samples:", len(dataset))
print("First sample:", dataset[0])
test_hours = torch.tensor([[7.0]])

predicted_marks = model(test_hours)

print("Hours studied:", test_hours.item())
print("Predicted Marks:", predicted_marks.item())
