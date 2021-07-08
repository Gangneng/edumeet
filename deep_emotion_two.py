import torch
import torch.nn as nn
import torch.nn.functional as F

class Deep_Emotion(nn.Module):
    def __init__(self):
        '''
        Deep_Emotion class contains the network architecture.
        '''
        super(Deep_Emotion,self).__init__()
        self.conv1 = nn.Conv2d(1,32, 3, padding=1)
        self.conv2 = nn.Conv2d(32,64,3, padding=1)
        self.norm1 = nn.BatchNorm2d(64)
        self.pool1 = nn.MaxPool2d(2)
        self.drop1 = nn.Dropout2d(p=0.25)

        self.conv3 = nn.Conv2d(64,128, 5, padding=2)
        self.norm2 = nn.BatchNorm2d(128)
        self.pool2 = nn.MaxPool2d(2)
        self.drop2 = nn.Dropout2d(p=0.25)

        self.conv4 = nn.Conv2d(128, 512, 3, padding=1)
        self.norm3 = nn.BatchNorm2d(512)
        self.pool3 = nn.MaxPool2d(2)
        self.drop3 = nn.Dropout2d(p=0.25)

        self.conv5 = nn.Conv2d(512, 512, 3, padding=1)
        self.norm4 = nn.BatchNorm2d(512)
        self.pool4 = nn.MaxPool2d(2)
        self.drop4 = nn.Dropout2d(p=0.25)

        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(4608, 256)
        self.norm5 = nn.BatchNorm1d(256)
        self.drop5 = nn.Dropout2d(p=0.25)

        self.fc2 = nn.Linear(256, 512)
        self.norm6 = nn.BatchNorm1d(512)
        self.drop6 = nn.Dropout2d(p=0.25)

        self.fc3 = nn.Linear(512,7)

    

    def forward(self,input):
        out = input

        #print(out.shape) # torch.Size([128, 1, 48, 48])

        out = F.relu(self.conv1(out))
        out = F.relu(self.conv2(out))
        out = self.norm1(out)
        out = self.pool1(out)
        out = self.drop1(out)

        #print(out.shape) # torch.Size([128, 64, 24, 24])       

        out = F.relu(self.conv3(out))
        out = self.norm2(out)
        out = self.pool2(out)
        out = self.drop2(out)

        #print(out.shape) # torch.Size([128, 128, 12, 12])

        out = F.relu(self.conv4(out))
        out = self.norm3(out)
        out = self.pool3(out)
        out = self.drop3(out)

        #print(out.shape) # torch.Size([128, 512, 6, 6])

        out = F.relu(self.conv5(out))
        out = self.norm4(out)
        out = self.pool4(out)
        out = self.drop4(out)

        #print(out.shape) # torch.Size([128, 512, 3, 3])
        
        out = self.flatten(out)
        #print(out.shape) # torch.Size([128, 4608])

        out = F.relu(self.fc1(out))
        out = self.norm5(out)
        out = self.drop5(out)

        #print(out.shape)

        out = F.relu(self.fc2(out))
        out = self.norm6(out)
        out = self.drop6(out)

        #print(out.shape)
        
        out = F.softmax(self.fc3(out))

        #print(out.shape)

        return out
